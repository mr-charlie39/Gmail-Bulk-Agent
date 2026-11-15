import { prisma } from '../config/db';

export class FollowUpService {
  public static async list(userId: string, campaignId?: string) {
    const where: any = { userId };
    if (campaignId) where.campaignId = campaignId;

    return prisma.followUp.findMany({
      where,
      include: {
        recipient: true,
        campaign: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  public static async schedule(
    userId: string,
    data: {
      campaignId?: string;
      recipientId: string;
      promptTemplate?: string;
      delayDays: number;
    }
  ) {
    // Verify recipient belongs to this user
    const recipient = await prisma.recipient.findUnique({
      where: { id: data.recipientId },
    });

    if (!recipient || recipient.userId !== userId) {
      throw new Error('Tenant Violation: Recipient not found or unauthorized access.');
    }

    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + (data.delayDays || 3));

    return prisma.followUp.create({
      data: {
        userId,
        campaignId: data.campaignId || null,
        recipientId: data.recipientId,
        promptTemplate: data.promptTemplate || null,
        delayDays: data.delayDays || 3,
        scheduledAt,
        status: 'SCHEDULED',
      },
    });
  }

  public static async cancel(id: string, userId: string) {
    return prisma.followUp.deleteMany({
      where: { id, userId },
    });
  }
}
