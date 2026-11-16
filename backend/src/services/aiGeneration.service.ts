import { EmailTemplateService } from './emailTemplateService';

/**
 * Backward compatibility wrapper delegating to zero-AI deterministic EmailTemplateService.
 * All external AI calls (Gemini, OpenAI, Claude) have been completely removed.
 */
export class AIGenerationService {
  public static async generateDraft(params: {
    recipientId: string;
    userId: string;
    campaignId?: string;
    customInstructions?: string;
  }) {
    return EmailTemplateService.generateDraft({
      recipientId: params.recipientId,
      userId: params.userId,
      campaignId: params.campaignId,
      customInstructions: params.customInstructions,
    });
  }

  public static async batchGenerate(params: {
    recipientIds: string[];
    userId: string;
    campaignId?: string;
    customInstructions?: string;
  }) {
    return EmailTemplateService.batchGenerate({
      recipientIds: params.recipientIds,
      userId: params.userId,
      campaignId: params.campaignId,
      customInstructions: params.customInstructions,
    });
  }
}
