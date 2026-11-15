import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AIGenerationService } from '../services/aiGeneration.service';
import { generateEmailSchema, batchGenerateEmailSchema } from '../validators/email.validator';

export class AIController {
  public static async generateDraft(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = generateEmailSchema.parse(req.body);
      const result = await AIGenerationService.generateDraft({
        ...validated,
        userId: req.user!.id,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async batchGenerate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = batchGenerateEmailSchema.parse(req.body);
      const results = await AIGenerationService.batchGenerate({
        ...validated,
        userId: req.user!.id,
      });
      res.json({ results });
    } catch (error) {
      next(error);
    }
  }
}
