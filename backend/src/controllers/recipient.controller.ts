import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { RecipientService } from '../services/recipient.service';
import { createRecipientSchema, batchRecipientSchema } from '../validators/recipient.validator';

export class RecipientController {
  public static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, category } = req.query;
      const recipients = await RecipientService.list(
        req.user!.id,
        typeof search === 'string' ? search : undefined,
        typeof category === 'string' ? category : undefined
      );
      res.json(recipients);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createRecipientSchema.parse(req.body);
      const recipient = await RecipientService.create(req.user!.id, validated);
      res.status(201).json(recipient);
    } catch (error) {
      next(error);
    }
  }

  public static async batchCreate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = batchRecipientSchema.parse(req.body);
      const recipients = await RecipientService.batchCreate(req.user!.id, validated.recipients);
      res.status(201).json({ createdCount: recipients.length, recipients });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await RecipientService.delete(id, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
