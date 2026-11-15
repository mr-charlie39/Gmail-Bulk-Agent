import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { SuppressionService } from '../services/suppression.service';

export class SuppressionController {
  public static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await SuppressionService.list(req.user!.id);
      res.json(list);
    } catch (error) {
      next(error);
    }
  }

  public static async add(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, reason } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      const item = await SuppressionService.add(req.user!.id, email, reason);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }

  public static async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      await SuppressionService.remove(req.user!.id, email);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
