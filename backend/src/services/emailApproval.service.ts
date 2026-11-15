import { prisma } from '../config/db';
import { GmailService } from './gmail.service';
import { logger } from '../utils/logger';
import { logAudit } from '../utils/auditLogger';

export class EmailApprovalService {
  /**
   * Retrieves pending emails requiring human review for the authenticated user
   */
  public static async getPendingApproval(userId: string) {
    return prisma.generatedEmail.findMany({
      where: {
        userId,
        approvalStatus: 'PENDING_APPROVAL',
      },
      include: {
        recipient: true,
        campaign: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update draft content (subject or body) before approving
   */
  public static async updateDraft(
    emailId: string,
    userId: string,
    updates: { subject?: string; bodyText?: string; bodyHtml?: string }
  ) {
    const email = await prisma.generatedEmail.findUnique({
      where: { id: emailId },
    });

    if (!email || email.userId !== userId) {
      throw new Error('Tenant Violation: Email draft not found or unauthorized access.');
    }

    if (email.approvalStatus === 'SENT') {
      throw new Error('Cannot edit an email that has already been dispatched.');
    }

    return prisma.generatedEmail.update({
      where: { id: emailId },
      data: {
        subject: updates.subject !== undefined ? updates.subject : email.subject,
        body: updates.bodyText !== undefined ? updates.bodyText : email.body,
        bodyHtml: updates.bodyHtml !== undefined ? updates.bodyHtml : email.bodyHtml,
        approvalStatus: 'PENDING_APPROVAL',
      },
      include: { recipient: true, campaign: true },
    });
  }

  /**
   * Approve a single draft. Optionally trigger immediate send if requested.
   */
  public static async approveEmail(
    emailId: string,
    userId: string,
    options: { sendImmediately?: boolean } = {}
  ) {
    const email = await prisma.generatedEmail.findUnique({
      where: { id: emailId },
    });

    if (!email || email.userId !== userId) {
      throw new Error('Tenant Violation: Email draft not found or unauthorized access.');
    }

    const updated = await prisma.generatedEmail.update({
      where: { id: emailId },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    await logAudit({
      actorUserId: userId,
      action: 'EMAIL_APPROVED',
      targetUserId: userId,
      metadata: { generatedEmailId: emailId, sendImmediately: Boolean(options.sendImmediately) },
    });

    logger.info(`Email ${emailId} approved by user ${userId}.`);

    if (options.sendImmediately) {
      return GmailService.sendApprovedEmail(emailId, userId);
    }

    return updated;
  }

  /**
   * Reject a draft with reason
   */
  public static async rejectEmail(emailId: string, userId: string, reason?: string) {
    const email = await prisma.generatedEmail.findUnique({
      where: { id: emailId },
    });

    if (!email || email.userId !== userId) {
      throw new Error('Tenant Violation: Email draft not found or unauthorized access.');
    }

    const updated = await prisma.generatedEmail.update({
      where: { id: emailId },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason: reason || 'Rejected by user',
      },
    });

    await logAudit({
      actorUserId: userId,
      action: 'EMAIL_REJECTED',
      targetUserId: userId,
      metadata: { generatedEmailId: emailId, reason },
    });

    return updated;
  }

  /**
   * Batch approve multiple drafts for a user
   */
  public static async batchApprove(
    emailIds: string[],
    userId: string,
    options: { sendImmediately?: boolean } = {}
  ) {
    const results = [];
    for (const id of emailIds) {
      try {
        const res = await this.approveEmail(id, userId, options);
        results.push({ emailId: id, success: true, result: res });
      } catch (err: any) {
        results.push({ emailId: id, success: false, error: err.message });
      }
    }
    return results;
  }
}
