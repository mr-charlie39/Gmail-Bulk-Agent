import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { EmailTemplateService } from '../services/emailTemplateService';
import { generateEmailSchema, batchGenerateEmailSchema } from '../validators/email.validator';

export class AIController {
  /**
   * Deterministic, zero-cost email generator (replaces legacy Gemini API calls)
   */
  public static async generateDraft(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = generateEmailSchema.parse(req.body);
      const result = await EmailTemplateService.generateDraft({
        recipientId: validated.recipientId,
        userId: req.user!.id,
        campaignId: validated.campaignId,
        customInstructions: validated.customInstructions,
      });
      res.json({
        ...result,
        draft: result.generatedEmail,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deterministic batch email generator with local SlopMonster quality check
   */
  public static async batchGenerate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = batchGenerateEmailSchema.parse(req.body);
      const results = await EmailTemplateService.batchGenerate({
        recipientIds: validated.recipientIds,
        userId: req.user!.id,
        campaignId: validated.campaignId,
        customInstructions: validated.customInstructions,
      });
      res.json({ results });
    } catch (error) {
      next(error);
    }
  }
}
