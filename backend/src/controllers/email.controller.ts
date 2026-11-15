import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { GmailService } from '../services/gmail.service';

export class EmailController {
  public static async sendEmail(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await GmailService.sendApprovedEmail(id, req.user!.id);
      if (!result.success) {
        res.status(400).json(result);
        return;
      }
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public static async batchSend(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { emailIds } = req.body;
      if (!Array.isArray(emailIds) || emailIds.length === 0) {
        res.status(400).json({ error: 'emailIds array is required' });
        return;
      }

      const results = [];
      for (const id of emailIds) {
        try {
          const resSend = await GmailService.sendApprovedEmail(id, req.user!.id);
          results.push({ emailId: id, ...resSend });
        } catch (err: any) {
          results.push({ emailId: id, success: false, error: err.message });
        }
      }

      res.json({ results });
    } catch (error) {
      next(error);
    }
  }
}
