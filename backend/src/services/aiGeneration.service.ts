import { getGeminiModel } from '../config/gemini';
import { prisma } from '../config/db';
import { AIResponsePayload } from '../types';
import { logger } from '../utils/logger';
import { logAudit } from '../utils/auditLogger';

const CATEGORY_PROMPTS: Record<string, string> = {
  ENTERPRISE:
    'Target audience: Decision makers. Tone: Natural, respectful, concise, clear value. Never use sales buzzwords or canned intros. Under 100 words.',
  STARTUP:
    'Target audience: Founders and tech leads. Tone: Direct, casual, authentic, peer-to-peer. No corporate jargon. Under 80 words.',
  INVESTOR:
    'Target audience: Investors. Tone: Sharp, high-signal, concise bullet points, traction metrics.',
  RECRUITER:
    'Target audience: Talent leads. Tone: Polite, direct, collaborative.',
  GENERAL:
    'Target audience: Professional contact. Tone: Warm, natural, human, friendly. Under 70 words.',
};

/**
 * Deliverability-focused natural human email generator
 */
function generateFallbackDraft(
  recipient: any,
  campaign: any,
  customInstructions?: string,
  senderName: string = 'Ali'
): AIResponsePayload {
  const name = recipient.name ? recipient.name.trim() : '';
  const company = recipient.company && !recipient.company.includes('Organization') ? recipient.company.trim() : '';

  let subject = name ? `Quick note, ${name}` : 'Quick hello';
  let bodyText = `Hi ${name || 'there'},\n\nHope you're having a good week.\n\nJust wanted to reach out directly to say hello and see how things are going on your end${company ? ` at ${company}` : ''}.\n\nWould be great to connect briefly if you have a moment.\n\nBest regards,\n${senderName}`;

  if (customInstructions && customInstructions.toLowerCase().includes('greeting')) {
    subject = name ? `Hello ${name}` : 'Hello from my end';
    bodyText = `Hi ${name || 'there'},\n\nHope you're doing well.\n\nWanted to reach out to say hello and introduce myself.\n\nWishing you a great rest of the week!\n\nBest,\n${senderName}`;
  } else if (recipient.category === 'ENTERPRISE') {
    subject = `${name ? `${name} - ` : ''}workflow automation${company ? ` at ${company}` : ''}`;
    bodyText = `Hi ${name || 'there'},\n\nHope your week is going well.\n\nI'm reaching out regarding your engineering workflows${company ? ` at ${company}` : ''}. We've helped similar teams streamline operations and eliminate bottlenecks.\n\nOpen to a brief 5-minute chat sometime this week?\n\nBest regards,\n${senderName}`;
  } else if (recipient.category === 'STARTUP') {
    subject = `Quick hello${company ? ` re: ${company}` : ''}`;
    bodyText = `Hi ${name || 'there'},\n\nHope you're having a great week.\n\nWanted to connect and see how things are scaling on your end. Would love to stay in touch and exchange notes.\n\nBest,\n${senderName}`;
  }

  if (campaign?.promptTemplate && !customInstructions?.toLowerCase().includes('greeting')) {
    bodyText += `\n\nP.S. ${campaign.promptTemplate}`;
  }

  const bodyHtml = `<div>${bodyText.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}</div>`;

  return {
    subject,
    bodyText,
    bodyHtml,
    personalizationNotes: `Human-tuned deliverability copy for ${recipient.email}`,
    tone: 'human-conversational',
  };
}

export class AIGenerationService {
  /**
   * Generates a hyper-personalized email draft with strict tenant isolation
   */
  public static async generateDraft(params: {
    recipientId: string;
    userId: string;
    campaignId?: string;
    customInstructions?: string;
  }) {
    // 1. Strict Tenant Isolation Check on Recipient
    const recipient = await prisma.recipient.findUnique({
      where: { id: params.recipientId },
    });

    if (!recipient || recipient.userId !== params.userId) {
      throw new Error(`Tenant Violation: Recipient not found or unauthorized access.`);
    }

    // 2. Strict Tenant Isolation Check on Campaign (if provided)
    let campaign = null;
    if (params.campaignId) {
      campaign = await prisma.campaign.findUnique({
        where: { id: params.campaignId },
      });
      if (!campaign || campaign.userId !== params.userId) {
        throw new Error('Tenant Violation: Campaign not found or unauthorized access.');
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { fullName: true, email: true },
    });
    const senderName = user?.fullName || 'Ali';

    const categoryKey = (recipient.category || 'GENERAL').toUpperCase();
    const audienceGuidance = CATEGORY_PROMPTS[categoryKey] || CATEGORY_PROMPTS.GENERAL;

    const systemPrompt = `
You are a real human writing a direct 1-on-1 email to a colleague or prospect.
CRITICAL INBOX DELIVERABILITY RULES (MUST FOLLOW TO AVOID SPAM FILTERS):
1. Write like an authentic human. NO spam trigger phrases ("I hope this email finds you well/in high spirits", "take a moment to", "reaching out to touch base", "synergy").
2. Subject line must be short, lowercase or natural sentence case (e.g., "quick hello", "intro", "hello [First Name]"). Max 5 words.
3. Keep the email body short (3 to 5 sentences maximum).
4. Sign off with the sender's real name: "${senderName}".
5. Return ONLY a valid JSON object matching the schema below.

Recipient Details:
- Name: ${recipient.name || ''}
- Email: ${recipient.email}
- Company: ${recipient.company || ''}
- Category: ${recipient.category || 'General'}

Sender Name: ${senderName}
User's Custom Notes: ${params.customInstructions || 'Warm authentic greeting'}

JSON Schema:
{
  "subject": "string",
  "bodyText": "string",
  "bodyHtml": "string",
  "personalizationNotes": "string",
  "tone": "string"
}
`;

    let parsed: AIResponsePayload;

    try {
      logger.info(`Invoking Gemini for recipient ${recipient.email}...`);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out after 12000ms')), 12000)
      );

      const generatePromise = (async () => {
        const model = getGeminiModel('gemini-3.8-flash');
        const result = await model.generateContent(systemPrompt);
        return result.response.text();
      })();

      const responseText = await Promise.race([generatePromise, timeoutPromise]);
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (apiError: any) {
      logger.warn(`Gemini generation notice (${apiError.message}). Instant deliverability engine activated.`);
      parsed = generateFallbackDraft(recipient, campaign, params.customInstructions, senderName);
    }

    // 3. Create record in GeneratedEmail table with PENDING_APPROVAL status
    const generatedEmail = await prisma.generatedEmail.create({
      data: {
        userId: params.userId,
        recipientId: recipient.id,
        campaignId: campaign?.id,
        subject: parsed.subject,
        body: parsed.bodyText,
        bodyHtml: parsed.bodyHtml,
        approvalStatus: 'PENDING_APPROVAL', // Strict human approval workflow
      },
      include: {
        recipient: true,
        campaign: true,
      },
    });

    // 4. Audit Log
    await logAudit({
      actorUserId: params.userId,
      action: 'EMAIL_GENERATED',
      targetUserId: params.userId,
      metadata: {
        generatedEmailId: generatedEmail.id,
        recipientEmail: recipient.email,
        campaignId: campaign?.id,
      },
    });

    return {
      generatedEmail,
      aiMeta: {
        personalizationNotes: parsed.personalizationNotes,
        tone: parsed.tone,
      },
    };
  }

  /**
   * Batch generates drafts for multiple recipients with tenant check
   */
  public static async batchGenerate(params: {
    recipientIds: string[];
    userId: string;
    campaignId?: string;
    customInstructions?: string;
  }) {
    const results = [];
    for (let i = 0; i < params.recipientIds.length; i++) {
      const recipientId = params.recipientIds[i];
      try {
        // Throttling guard: pause 1.2s between calls to prevent 429 quota exhaustion on Gemini free tier
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }

        const res = await this.generateDraft({
          recipientId,
          userId: params.userId,
          campaignId: params.campaignId,
          customInstructions: params.customInstructions,
        });
        results.push({ recipientId, success: true, emailId: res.generatedEmail.id });
      } catch (err: any) {
        results.push({ recipientId, success: false, error: err.message });
      }
    }
    return results;
  }
}
