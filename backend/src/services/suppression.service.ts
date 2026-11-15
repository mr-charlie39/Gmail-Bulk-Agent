import { prisma } from '../config/db';

export class SuppressionService {
  public static async list(userId: string) {
    return prisma.suppressionEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async add(userId: string, email: string, reason: string = 'MANUAL') {
    const normalizedEmail = email.trim().toLowerCase();
    return prisma.suppressionEntry.upsert({
      where: {
        userId_email: { userId, email: normalizedEmail },
      },
      create: { userId, email: normalizedEmail, reason },
      update: { reason },
    });
  }

  public static async remove(userId: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return prisma.suppressionEntry.deleteMany({
      where: { userId, email: normalizedEmail },
    });
  }

  public static async isSuppressed(userId: string, email: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const item = await prisma.suppressionEntry.findUnique({
      where: { userId_email: { userId, email: normalizedEmail } },
    });
    return !!item;
  }
}
