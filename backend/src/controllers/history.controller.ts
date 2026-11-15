import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { EmailHistoryService } from '../services/emailHistory.service';

export class HistoryController {
  public static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, campaignId, recipientId } = req.query;
      const items = await EmailHistoryService.list(req.user!.id, {
        status: typeof status === 'string' ? status : undefined,
        campaignId: typeof campaignId === 'string' ? campaignId : undefined,
        recipientId: typeof recipientId === 'string' ? recipientId : undefined,
      });
      res.json(items);
    } catch (error) {
      next(error);
    }
  }

  public static async getDetail(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const item = await EmailHistoryService.getDetail(id, req.user!.id);
      if (!item) {
        res.status(404).json({ error: 'Email record not found' });
        return;
      }
      res.json(item);
    } catch (error) {
      next(error);
    }
  }
}
