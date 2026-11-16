import { prisma } from '../config/db';
import { SlopMonsterService, SlopMonsterResult } from './slopMonsterService';
import { logger } from '../utils/logger';
import { logAudit } from '../utils/auditLogger';

export interface EmailTemplateDefinition {
  id?: string;
  key: string;
  name: string;
  category: string;
  description: string;
  subjectTemplate: string;
  openingSentence: string;
  reasonForContact: string;
  relevantService: string;
  portfolioInfo: string;
  naturalClosing: string;
  isCustom?: boolean;
}

export const BUILTIN_TEMPLATES: EmailTemplateDefinition[] = [
  {
    key: 'SOFTWARE_DEV',
    category: 'SOFTWARE_DEV',
    name: 'Software Development Services',
    description: 'Direct outreach offering custom full-stack software development.',
    subjectTemplate: 'Software engineering for {{company}}',
    openingSentence: 'Hi {{recipientName}},',
    reasonForContact: 'I am reaching out regarding software engineering needs at {{company}}.',
    relevantService:
      'I specialize in full-stack architecture, clean codebases, and maintainable web and API systems.',
    portfolioInfo: 'You can review my recent technical projects and code at {{portfolioUrl}}.',
    naturalClosing: 'Would you be open to a brief conversation this week to see if my background matches your technical roadmap?',
  },
  {
    key: 'WEB_DEV',
    category: 'WEB_DEV',
    name: 'Website Development Services',
    description: 'Outreach offering modern, high-performance web development.',
    subjectTemplate: 'Web development for {{company}}',
    openingSentence: 'Hi {{recipientName}},',
    reasonForContact: 'I am writing regarding web development and technical improvements for {{company}}.',
    relevantService:
      'I build fast, responsive web applications using TypeScript and React.',
    portfolioInfo: 'Selected project work and live applications are available at {{portfolioUrl}}.',
    naturalClosing: 'If you have upcoming web development work, I would be glad to discuss how I can assist your team.',
  },
  {
    key: 'CUSTOM_SOFTWARE',
    category: 'CUSTOM_SOFTWARE',
    name: 'Custom Software Solutions',
    description: 'Outreach for tailored internal tools, workflow automation, and custom systems.',
    subjectTemplate: 'Custom software solutions for {{company}}',
    openingSentence: 'Hi {{recipientName}},',
    reasonForContact: 'I am reaching out to see if {{company}} needs custom internal tools or system integrations.',
    relevantService:
      'I design tailored software solutions that automate manual workflows and connect existing systems.',
    portfolioInfo: 'You can review my software engineering portfolio at {{portfolioUrl}}.',
    naturalClosing: 'Let me know if you would like to connect for a quick 10-minute introductory call.',
  },
  {
    key: 'RESTAURANT_POS',
    category: 'RESTAURANT_POS',
    name: 'Restaurant POS Systems',
    description: 'Outreach offering tailored restaurant point-of-sale and order management systems.',
    subjectTemplate: 'POS & order management software for {{company}}',
    openingSentence: 'Hi {{recipientName}},',
    reasonForContact: 'I am writing regarding point-of-sale and ordering technology for {{company}}.',
    relevantService:
      'I develop dependable POS systems featuring table management and kitchen display workflows.',
    portfolioInfo: 'Technical demonstrations and architecture overviews can be reviewed at {{portfolioUrl}}.',
    naturalClosing: 'I would be happy to show you a quick demonstration if you are considering updating your ordering system.',
  },
  {
    key: 'DESKTOP_APP',
    category: 'DESKTOP_APP',
    name: 'Desktop Applications',
    description: 'Outreach for cross-platform desktop application engineering.',
    subjectTemplate: 'Desktop application development for {{company}}',
    openingSentence: 'Hi {{recipientName}},',
    reasonForContact: 'I am reaching out regarding desktop software engineering at {{company}}.',
    relevantService:
      'I build stable, cross-platform desktop applications with offline capability and clean interfaces.',
    portfolioInfo: 'My desktop software portfolio and code samples are available at {{portfolioUrl}}.',
    naturalClosing: 'Are you open to a brief chat to discuss your desktop software requirements?',
  },
  {
    key: 'MOBILE_APP',
    category: 'MOBILE_APP',
    name: 'Mobile Applications',
    description: 'Outreach for iOS and Android mobile application development.',
    subjectTemplate: 'Mobile app development for {{company}}',
    openingSentence: 'Hi {{recipientName}},',
    reasonForContact: 'I am writing to inquire if {{company}} has active mobile development initiatives.',
    relevantService:
      'I build cross-platform mobile applications with smooth navigation and backend synchronization.',
    portfolioInfo: 'Examples of completed mobile projects can be viewed at {{portfolioUrl}}.',
    naturalClosing: 'Would you be open to an introductory discussion about your mobile roadmap?',
  },
  {
    key: 'REACT_FRONTEND',
    category: 'REACT_FRONTEND',
    name: 'React and Frontend Development',
    description: 'Specialized frontend engineering with React, TypeScript, and Tailwind CSS.',
    subjectTemplate: 'Frontend development with React & TypeScript for {{company}}',
    openingSentence: 'Hi {{recipientName}},',
    reasonForContact: 'I am writing to see if {{company}} needs frontend engineering capacity.',
    relevantService:
      'I specialize in React and TypeScript frontends, building structured component systems and responsive user interfaces.',
    portfolioInfo: 'You can inspect my codebases and component work at {{portfolioUrl}}.',
    naturalClosing: 'I would appreciate the chance to connect if you have frontend work in progress.',
  },
  {
    key: 'JAVA_SPRING',
    category: 'JAVA_SPRING',
    name: 'Java and Spring Boot Backend Development',
    description: 'Backend engineering using Java, Spring Boot, and PostgreSQL.',
    subjectTemplate: 'Java & Spring Boot backend engineering for {{company}}',
    openingSentence: 'Hi {{recipientName}},',
    reasonForContact: 'I am reaching out regarding backend engineering and API architecture at {{company}}.',
    relevantService:
      'I develop backend systems using Java and Spring Boot, focusing on secure REST APIs and clean database modeling.',
    portfolioInfo: 'My backend architecture work and technical writeups are available at {{portfolioUrl}}.',
    naturalClosing: 'Let me know if your engineering team has room for backend assistance this quarter.',
  },
  {
    key: 'STARTUP_COLLAB',
    category: 'STARTUP_COLLAB',
    name: 'Startup Collaboration',
    description: 'Technical collaboration and MVP development for early-stage startups.',
    subjectTemplate: 'Technical collaboration / MVP development for {{company}}',
    openingSentence: 'Hi {{recipientName}},',
    reasonForContact: 'I follow your work at {{company}} and wanted to reach out directly.',
    relevantService:
      'I assist early-stage founders by developing functional MVPs and full-stack software with sensible architecture.',
    portfolioInfo: 'Details of my software projects are published at {{portfolioUrl}}.',
    naturalClosing: 'Would you have ten minutes this week to share notes on what you are currently building?',
  },
  {
    key: 'INTERNSHIP_JOB',
    category: 'INTERNSHIP_JOB',
    name: 'Internship and Job Opportunities',
    description: 'Direct inquiry regarding software engineering positions and internships.',
    subjectTemplate: 'Software engineering opportunities - {{senderName}}',
    openingSentence: 'Dear {{recipientName}},',
    reasonForContact: 'I am writing to express my interest in software engineering roles at {{company}}.',
    relevantService:
      'My technical background centers on full-stack development with React frontends and Node backends.',
    portfolioInfo: 'My complete technical portfolio and project code can be reviewed at {{portfolioUrl}}.',
    naturalClosing: 'I would welcome the opportunity to discuss how my technical skills can contribute to your team.',
  },
  {
    key: 'NETWORKING',
    category: 'NETWORKING',
    name: 'Professional Networking',
    description: 'Peer-to-peer connection regarding software engineering and technology.',
    subjectTemplate: 'Connecting regarding software engineering - {{senderName}}',
    openingSentence: 'Hi {{recipientName}},',
    reasonForContact: 'I came across your work in software engineering and wanted to say hello.',
    relevantService:
      'I am an active full-stack engineer and enjoy staying in touch with peers working on interesting technical systems.',
    portfolioInfo: 'I share my development work and open-source projects at {{portfolioUrl}}.',
    naturalClosing: 'Wishing you a productive week ahead, and glad to connect.',
  },
];

export interface EmailCompositionResult {
  generatedEmail: any;
  slopResult: SlopMonsterResult;
  usedTemplate: EmailTemplateDefinition;
}

export class EmailTemplateService {
  /**
   * Retrieves all available templates for a user (built-in + user-saved)
   */
  public static async getTemplatesForUser(userId: string): Promise<EmailTemplateDefinition[]> {
    const userTemplates = await prisma.emailTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const customDefs: EmailTemplateDefinition[] = userTemplates.map((t) => ({
      id: t.id,
      key: t.id,
      category: t.category,
      name: t.name,
      description: t.description || 'Personal custom template',
      subjectTemplate: t.subjectTemplate,
      openingSentence: t.openingSentence,
      reasonForContact: t.reasonForContact,
      relevantService: t.relevantService,
      portfolioInfo: t.portfolioInfo || '',
      naturalClosing: t.naturalClosing,
      isCustom: true,
    }));

    return [...BUILTIN_TEMPLATES, ...customDefs];
  }

  /**
   * Deterministically composes subject and bodyText in-memory
   */
  public static composeDraftText(
    templateDef: EmailTemplateDefinition,
    senderProfile: any,
    recipient: any,
    customInstructions?: string
  ): { subject: string; bodyText: string; bodyHtml: string } {
    const senderName = senderProfile?.fullName || 'Muhammad Ali';
    const senderTitle = senderProfile?.professionalTitle || 'Software Engineer';
    const portfolioUrl = senderProfile?.portfolioUrl || senderProfile?.githubUrl || '';
    const rawRecipientName = recipient.name || recipient.firstName || '';
    const firstName = rawRecipientName.split(/\s+/)[0] || '';
    const hasCompany = recipient.company && recipient.company.trim().length > 0;
    const company = hasCompany ? recipient.company.trim() : '';

    let subject = templateDef.subjectTemplate
      .replace(/{{company}}/g, company || (recipient.industry ? `${recipient.industry} engineering` : 'technical projects'))
      .replace(/{{recipientName}}/g, firstName || 'there')
      .replace(/{{senderName}}/g, senderName)
      .trim();

    let opening = templateDef.openingSentence.replace(/{{recipientName}}/g, firstName || 'there');

    let reason = templateDef.reasonForContact;
    if (hasCompany) {
      reason = reason.replace(/{{company}}/g, company);
    } else {
      reason = reason
        .replace(/at\s+{{company}}/g, 'at your organization')
        .replace(/for\s+{{company}}/g, 'for your team')
        .replace(/{{company}}/g, 'your team');
    }

    let service = templateDef.relevantService;

    let customNoteSentence = '';
    if (customInstructions && customInstructions.trim()) {
      const cleanNote = customInstructions.trim();
      customNoteSentence = cleanNote.endsWith('.') ? cleanNote : `${cleanNote}.`;
    }

    let portfolioSentence = '';
    if (portfolioUrl && portfolioUrl.trim() && templateDef.portfolioInfo) {
      portfolioSentence = templateDef.portfolioInfo.replace(/{{portfolioUrl}}/g, portfolioUrl);
    }

    const closing = templateDef.naturalClosing;
    const signature =
      senderProfile?.signature ||
      `Best regards,\n${senderName}\n${senderTitle}`;

    const paragraphs: string[] = [opening];
    const bodyParagraph = [reason, service, customNoteSentence].filter(Boolean).join(' ');
    paragraphs.push(bodyParagraph);
    if (portfolioSentence) paragraphs.push(portfolioSentence);
    paragraphs.push(closing);
    paragraphs.push(signature);

    const bodyText = paragraphs.join('\n\n').trim();
    const bodyHtml = `<div>${bodyText.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}</div>`;

    return { subject, bodyText, bodyHtml };
  }

  /**
   * Generates a deterministic email draft from verified recipient and sender profile details
   * with zero AI dependencies, and scores it through SlopMonster.
   */
  public static async generateDraft(params: {
    recipientId: string;
    userId: string;
    templateKeyOrId?: string;
    customInstructions?: string;
    campaignId?: string;
  }): Promise<EmailCompositionResult> {
    // 1. Fetch recipient with tenant isolation
    const recipient = await prisma.recipient.findUnique({
      where: { id: params.recipientId },
    });

    if (!recipient || recipient.userId !== params.userId) {
      throw new Error('Tenant Violation: Recipient not found or unauthorized access.');
    }

    // 2. Fetch sender profile
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error('Authenticated user account not found.');
    }

    const senderProfile = user.profile;
    const senderName = senderProfile?.fullName || user.fullName || 'Muhammad Ali';
    const senderTitle = senderProfile?.professionalTitle || 'Software Engineer';
    const portfolioUrl =
      senderProfile?.portfolioUrl || senderProfile?.githubUrl || 'https://github.com/mr-charlie39';

    // 3. Find template
    const allTemplates = await this.getTemplatesForUser(params.userId);
    let chosenTemplate =
      allTemplates.find(
        (t) =>
          t.key === params.templateKeyOrId ||
          t.id === params.templateKeyOrId ||
          t.category === params.templateKeyOrId
      ) ||
      allTemplates.find((t) => t.category === recipient.category) ||
      BUILTIN_TEMPLATES[0];

    // 4. Deterministic substitution (never fabricate details)
    const rawRecipientName = recipient.name ? recipient.name.trim() : '';
    const firstName = rawRecipientName.split(/\s+/)[0] || '';
    const hasCompany = recipient.company && recipient.company.trim().length > 0;
    const company = hasCompany ? recipient.company!.trim() : '';

    // Subject generation
    let subject = chosenTemplate.subjectTemplate
      .replace(/{{company}}/g, company || (recipient.industry ? `${recipient.industry} engineering` : 'technical projects'))
      .replace(/{{recipientName}}/g, firstName || 'there')
      .replace(/{{senderName}}/g, senderName)
      .trim();

    // Opening sentence
    let opening = chosenTemplate.openingSentence.replace(
      /{{recipientName}}/g,
      firstName || 'there'
    );

    // Reason for contacting (omit company phrase if missing)
    let reason = chosenTemplate.reasonForContact;
    if (hasCompany) {
      reason = reason.replace(/{{company}}/g, company);
    } else {
      reason = reason
        .replace(/at\s+{{company}}/g, 'at your organization')
        .replace(/for\s+{{company}}/g, 'for your team')
        .replace(/{{company}}/g, 'your team');
    }

    // Relevant service / value proposition
    let service = chosenTemplate.relevantService;

    // Optional user custom note inserted cleanly if provided
    let customNoteSentence = '';
    if (params.customInstructions && params.customInstructions.trim()) {
      const cleanNote = params.customInstructions.trim();
      customNoteSentence = cleanNote.endsWith('.') ? cleanNote : `${cleanNote}.`;
    }

    // Portfolio sentence (omit entirely if no portfolio URL is known)
    let portfolioSentence = '';
    if (portfolioUrl && portfolioUrl.trim() && chosenTemplate.portfolioInfo) {
      portfolioSentence = chosenTemplate.portfolioInfo.replace(/{{portfolioUrl}}/g, portfolioUrl);
    }

    // Natural closing
    const closing = chosenTemplate.naturalClosing;

    // Signature
    const signature =
      senderProfile?.signature ||
      `Best regards,\n${senderName}\n${senderTitle}${user.email ? ` | ${user.email}` : ''}`;

    // Assemble paragraphs
    const paragraphs: string[] = [opening];

    const bodyParagraph = [reason, service, customNoteSentence].filter(Boolean).join(' ');
    paragraphs.push(bodyParagraph);

    if (portfolioSentence) {
      paragraphs.push(portfolioSentence);
    }

    paragraphs.push(closing);
    paragraphs.push(signature);

    const bodyText = paragraphs.join('\n\n').trim();
    const bodyHtml = `<div>${bodyText.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}</div>`;

    // 5. Run SlopMonster local quality check
    const slopResult = await SlopMonsterService.checkCopy(`${subject}\n\n${bodyText}`);

    // 6. Save in GeneratedEmail table with status
    const initialStatus = slopResult.clean ? 'QUALITY_CHECKED' : 'DRAFT';

    const generatedEmail = await prisma.generatedEmail.create({
      data: {
        userId: params.userId,
        recipientId: recipient.id,
        campaignId: params.campaignId,
        templateId: chosenTemplate.id,
        templateKey: chosenTemplate.key,
        subject,
        body: bodyText,
        bodyHtml,
        status: initialStatus,
        approvalStatus: initialStatus,
        slopScore: slopResult.score,
        slopClean: slopResult.clean,
        slopReport: slopResult.rawReport,
      },
      include: {
        recipient: true,
        campaign: true,
      },
    });

    await logAudit({
      actorUserId: params.userId,
      action: 'EMAIL_COMPOSED',
      targetUserId: params.userId,
      metadata: {
        generatedEmailId: generatedEmail.id,
        recipientEmail: recipient.email,
        templateKey: chosenTemplate.key,
        slopScore: slopResult.score,
        slopClean: slopResult.clean,
      },
    });

    return {
      generatedEmail,
      slopResult,
      usedTemplate: chosenTemplate,
    };
  }

  /**
   * Batch generates deterministic drafts for multiple recipients
   */
  public static async batchGenerate(params: {
    recipientIds: string[];
    userId: string;
    templateKeyOrId?: string;
    customInstructions?: string;
    campaignId?: string;
  }) {
    const results = [];
    for (const recipientId of params.recipientIds) {
      try {
        const res = await this.generateDraft({
          recipientId,
          userId: params.userId,
          templateKeyOrId: params.templateKeyOrId,
          customInstructions: params.customInstructions,
          campaignId: params.campaignId,
        });
        results.push({
          recipientId,
          success: true,
          emailId: res.generatedEmail.id,
          slopScore: res.slopResult.score,
          slopClean: res.slopResult.clean,
        });
      } catch (err: any) {
        results.push({ recipientId, success: false, error: err.message });
      }
    }
    return results;
  }
}
