import { google } from 'googleapis';
import { prisma } from '../config/db';
import { GoogleOAuthService } from './googleOAuth.service';
import { buildRawEmail } from '../utils/emailBuilder';
import { logger } from '../utils/logger';
import { logAudit } from '../utils/auditLogger';
import { SendEmailResult } from '../types';

export class GmailService {
  /**
   * Sends an email via Gmail API with strict multi-user tenant checks and human approval enforcement.
   */
  public static async sendApprovedEmail(generatedEmailId: string, userId: string): Promise<SendEmailResult> {
    const emailRecord = await prisma.generatedEmail.findUnique({
      where: { id: generatedEmailId },
      include: {
        recipient: true,
        campaign: true,
        user: true,
      },
    });

    if (!emailRecord) {
      throw new Error(`Generated email record ${generatedEmailId} not found.`);
    }

    // 1. Strict Tenant Isolation Check
    if (emailRecord.userId !== userId) {
      throw new Error('Tenant Violation: Unauthorized attempt to send email belonging to another user.');
    }

    // 2. Strict Account Active Check
    if (emailRecord.user.status !== 'ACTIVE') {
      throw new Error('Account Deactivated: Inactive accounts cannot send emails.');
    }

    // 3. Strict Human Approval Check
    if (emailRecord.approvalStatus !== 'APPROVED') {
      throw new Error(
        `Safety Guardrail Violation: Email status is "${emailRecord.approvalStatus}". Explicit approval is required before sending.`
      );
    }

    // 4. Suppression List Check
    const isSuppressed = await prisma.suppressionEntry.findUnique({
      where: {
        userId_email: {
          userId,
          email: emailRecord.recipient.email,
        },
      },
    });

    if (isSuppressed) {
      await prisma.sentEmail.create({
        data: {
          userId,
          campaignId: emailRecord.campaignId,
          recipientId: emailRecord.recipientId,
          subject: emailRecord.subject,
          status: 'FAILED',
          errorMessage: `Recipient ${emailRecord.recipient.email} is in suppression list (Reason: ${isSuppressed.reason})`,
        },
      });

      return {
        success: false,
        error: `Recipient is on suppression list (${isSuppressed.reason})`,
      };
    }

    try {
      // 5. User-Specific Gmail Connection
      const { oauth2Client, senderEmail, senderName } = await GoogleOAuthService.getAuthorizedClient(userId);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // 6. Deliverability-Optimized RFC 5322 MIME Email
      const raw = buildRawEmail({
        to: emailRecord.recipient.email,
        from: senderEmail,
        fromName: senderName,
        subject: emailRecord.subject,
        bodyText: emailRecord.body,
        bodyHtml: emailRecord.bodyHtml || undefined,
      });

      logger.info(`Sending email ${generatedEmailId} to ${emailRecord.recipient.email} from ${senderEmail} (${senderName})...`);

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      const messageId = response.data.id || undefined;
      const threadId = response.data.threadId || undefined;

      // 7. Record in SentEmail table
      const sentRecord = await prisma.sentEmail.create({
        data: {
          userId,
          campaignId: emailRecord.campaignId,
          recipientId: emailRecord.recipientId,
          subject: emailRecord.subject,
          gmailMessageId: messageId,
          gmailThreadId: threadId,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // Update GeneratedEmail approval status
      await prisma.generatedEmail.update({
        where: { id: generatedEmailId },
        data: { approvalStatus: 'SENT' },
      });

      // 8. Audit Log
      await logAudit({
        actorUserId: userId,
        action: 'EMAIL_SENT',
        targetUserId: userId,
        metadata: {
          generatedEmailId,
          sentEmailId: sentRecord.id,
          to: emailRecord.recipient.email,
          senderEmail,
          gmailMessageId: messageId,
        },
      });

      logger.info(`Email ${generatedEmailId} sent successfully via Gmail. MessageId: ${messageId}`);
      return { success: true, messageId, threadId };
    } catch (error: any) {
      logger.error(`Failed to send email ${generatedEmailId}:`, error);

      await prisma.sentEmail.create({
        data: {
          userId,
          campaignId: emailRecord.campaignId,
          recipientId: emailRecord.recipientId,
          subject: emailRecord.subject,
          status: 'FAILED',
          errorMessage: error.message || 'Unknown Gmail API error',
        },
      });

      await logAudit({
        actorUserId: userId,
        action: 'EMAIL_SENDING_FAILED',
        targetUserId: userId,
        metadata: {
          generatedEmailId,
          to: emailRecord.recipient.email,
          error: error.message,
        },
      });

      return {
        success: false,
        error: error.message || 'Gmail sending failed',
      };
    }
  }
}
