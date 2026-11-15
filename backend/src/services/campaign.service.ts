import { prisma } from '../config/db';
import { logAudit } from '../utils/auditLogger';

export class CampaignService {
  public static async list(userId: string) {
    return prisma.campaign.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            generatedEmails: true,
            sentEmails: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getById(id: string, userId: string) {
    return prisma.campaign.findFirst({
      where: { id, userId }, // Strict tenant isolation prevents IDOR!
      include: {
        generatedEmails: {
          include: { recipient: true },
          orderBy: { createdAt: 'desc' },
        },
        sentEmails: {
          include: { recipient: true },
          orderBy: { sentAt: 'desc' },
        },
        followUps: {
          include: { recipient: true },
        },
      },
    });
  }

  public static async create(userId: string, data: any) {
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name: data.name,
        promptTemplate: data.promptTemplate || null,
        subjectTemplate: data.subjectTemplate || null,
        status: data.status || 'DRAFT',
      },
    });

    await logAudit({
      actorUserId: userId,
      action: 'CAMPAIGN_CREATED',
      targetUserId: userId,
      metadata: { campaignId: campaign.id, name: campaign.name },
    });

    return campaign;
  }

  public static async update(id: string, userId: string, data: any) {
    const updated = await prisma.campaign.updateMany({
      where: { id, userId }, // Strict tenant check
      data,
    });

    if (updated.count > 0) {
      await logAudit({
        actorUserId: userId,
        action: 'CAMPAIGN_UPDATED',
        targetUserId: userId,
        metadata: { campaignId: id, updates: data },
      });
    }

    return { success: true, count: updated.count };
  }

  public static async delete(id: string, userId: string) {
    const deleted = await prisma.campaign.deleteMany({
      where: { id, userId }, // Strict tenant check
    });

    if (deleted.count > 0) {
      await logAudit({
        actorUserId: userId,
        action: 'CAMPAIGN_DELETED',
        targetUserId: userId,
        metadata: { campaignId: id },
      });
    }

    return { success: true, count: deleted.count };
  }
}
