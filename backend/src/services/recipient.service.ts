import { prisma } from '../config/db';
import { logAudit } from '../utils/auditLogger';

export class RecipientService {
  public static async list(userId: string, search?: string, category?: string) {
    const where: any = { userId };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }
    return prisma.recipient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async create(userId: string, data: any) {
    const recipient = await prisma.recipient.create({
      data: {
        userId,
        name: data.name || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : null),
        email: data.email.trim().toLowerCase(),
        company: data.company || null,
        category: data.category || 'GENERAL',
        website: data.website || null,
        status: 'ACTIVE',
      },
    });

    await logAudit({
      actorUserId: userId,
      action: 'RECIPIENT_CREATED',
      targetUserId: userId,
      metadata: { recipientEmail: recipient.email, recipientId: recipient.id },
    });

    return recipient;
  }

  public static async batchCreate(userId: string, recipients: any[]) {
    const created = [];
    for (const r of recipients) {
      if (!r.email || !r.email.includes('@')) continue;
      const normalizedEmail = r.email.trim().toLowerCase();
      try {
        const item = await prisma.recipient.upsert({
          where: {
            userId_email: {
              userId,
              email: normalizedEmail,
            },
          },
          create: {
            userId,
            name: r.name || (r.firstName ? `${r.firstName} ${r.lastName || ''}`.trim() : null),
            email: normalizedEmail,
            company: r.company || null,
            category: r.category || 'GENERAL',
            website: r.website || null,
            status: 'ACTIVE',
          },
          update: {
            name: r.name || (r.firstName ? `${r.firstName} ${r.lastName || ''}`.trim() : undefined),
            company: r.company || undefined,
            category: r.category || undefined,
          },
        });
        created.push(item);
      } catch (err) {
        // Skip duplicate or malformed
      }
    }

    await logAudit({
      actorUserId: userId,
      action: 'RECIPIENTS_BATCH_IMPORTED',
      targetUserId: userId,
      metadata: { count: created.length },
    });

    return created;
  }

  public static async delete(id: string, userId: string) {
    const deleted = await prisma.recipient.deleteMany({
      where: { id, userId }, // Strict tenant isolation prevents IDOR!
    });

    if (deleted.count > 0) {
      await logAudit({
        actorUserId: userId,
        action: 'RECIPIENT_DELETED',
        targetUserId: userId,
        metadata: { recipientId: id },
      });
    }

    return { success: true, count: deleted.count };
  }
}
