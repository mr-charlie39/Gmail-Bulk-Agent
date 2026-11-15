import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AnalyticsService } from '../services/analytics.service';
import { prisma } from '../config/db';

export class UserDashboardController {
  public static async getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const overview = await AnalyticsService.getOverview(userId);
      res.json(overview);
    } catch (error) {
      next(error);
    }
  }

  public static async sendCampaignEmails(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const campaignId = req.params.id as string;

      // 1. Verify campaign belongs to authenticated user
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, userId },
      });

      if (!campaign) {
        res.status(404).json({ error: 'Tenant Violation: Campaign not found or unauthorized access.' });
        return;
      }

      // 2. Fetch approved emails for this campaign
      const approvedEmails = await prisma.generatedEmail.findMany({
        where: {
          campaignId,
          userId,
          approvalStatus: 'APPROVED',
        },
      });

      if (approvedEmails.length === 0) {
        res.status(400).json({ error: 'No approved emails found ready for dispatch in this campaign.' });
        return;
      }

      // 3. Dispatch sequential sending
      const { GmailService } = await import('../services/gmail.service');
      const results = [];
      for (const email of approvedEmails) {
        try {
          const sendRes = await GmailService.sendApprovedEmail(email.id, userId);
          results.push({ emailId: email.id, ...sendRes });
        } catch (err: any) {
          results.push({ emailId: email.id, success: false, error: err.message });
        }
      }

      res.json({
        totalDispatched: results.length,
        results,
      });
    } catch (error) {
      next(error);
    }
  }
}
