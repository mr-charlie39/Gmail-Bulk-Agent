import { prisma } from '../config/db';

export class AnalyticsService {
  /**
   * User-specific workspace analytics (Strict Tenant Isolation)
   */
  public static async getOverview(userId: string) {
    const [totalGenerated, sent, pending, approved, rejected, failed, totalRecipients, campaigns] =
      await Promise.all([
        prisma.generatedEmail.count({ where: { userId } }),
        prisma.sentEmail.count({ where: { userId, status: 'SENT' } }),
        prisma.generatedEmail.count({ where: { userId, approvalStatus: 'PENDING_APPROVAL' } }),
        prisma.generatedEmail.count({ where: { userId, approvalStatus: 'APPROVED' } }),
        prisma.generatedEmail.count({ where: { userId, approvalStatus: 'REJECTED' } }),
        prisma.sentEmail.count({ where: { userId, status: 'FAILED' } }),
        prisma.recipient.count({ where: { userId } }),
        prisma.campaign.count({ where: { userId } }),
      ]);

    const gmailConn = await prisma.gmailConnection.findUnique({
      where: { userId },
      select: { gmailAddress: true, connected: true, updatedAt: true },
    });

    const recentActivity = await prisma.sentEmail.findMany({
      where: { userId },
      include: { recipient: true, campaign: true },
      orderBy: { sentAt: 'desc' },
      take: 10,
    });

    return {
      kpis: {
        totalEmails: totalGenerated,
        sent,
        pending,
        approved,
        rejected,
        failed,
        totalRecipients,
        campaigns,
        approvalRate: totalGenerated > 0 ? Math.round(((sent + approved) / totalGenerated) * 100) : 0,
      },
      googleConnection: gmailConn && gmailConn.connected
        ? {
            connected: true,
            email: gmailConn.gmailAddress,
            lastSynced: gmailConn.updatedAt,
          }
        : { connected: false, email: null },
      recentActivity,
    };
  }
}
