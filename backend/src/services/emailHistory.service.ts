import { prisma } from '../config/db';

export class EmailHistoryService {
  public static async list(
    userId: string,
    filters?: { status?: string; campaignId?: string; recipientId?: string }
  ) {
    const where: any = { userId };
    if (filters?.status) where.status = filters.status;
    if (filters?.campaignId) where.campaignId = filters.campaignId;
    if (filters?.recipientId) where.recipientId = filters.recipientId;

    return prisma.sentEmail.findMany({
      where,
      include: {
        recipient: true,
        campaign: true,
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
  }

  public static async getDetail(id: string, userId: string) {
    return prisma.sentEmail.findFirst({
      where: { id, userId }, // Strict tenant isolation prevents IDOR!
      include: {
        recipient: true,
        campaign: true,
      },
    });
  }
}
