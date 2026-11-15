import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { EmailApprovalService } from '../services/emailApproval.service';
import { updateEmailDraftSchema } from '../validators/email.validator';

export class ApprovalController {
  public static async getPending(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await EmailApprovalService.getPendingApproval(req.user!.id);
      res.json(list);
    } catch (error) {
      next(error);
    }
  }

  public static async updateDraft(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validated = updateEmailDraftSchema.parse(req.body);
      const updated = await EmailApprovalService.updateDraft(id, req.user!.id, validated);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  public static async approve(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { sendImmediately } = req.body;
      const result = await EmailApprovalService.approveEmail(id, req.user!.id, {
        sendImmediately: Boolean(sendImmediately),
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async reject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const result = await EmailApprovalService.rejectEmail(id, req.user!.id, reason);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async batchApprove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { emailIds, sendImmediately } = req.body;
      if (!Array.isArray(emailIds) || emailIds.length === 0) {
        res.status(400).json({ error: 'emailIds array is required' });
        return;
      }
      const results = await EmailApprovalService.batchApprove(emailIds, req.user!.id, {
        sendImmediately: Boolean(sendImmediately),
      });
      res.json({ results });
    } catch (error) {
      next(error);
    }
  }
}
