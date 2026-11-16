import { google } from 'googleapis';
import { prisma } from '../config/db';
import { GoogleOAuthService } from './googleOAuth.service';
import { buildRawEmail } from '../utils/emailBuilder';
import { logger } from '../utils/logger';
import { logAudit } from '../utils/auditLogger';

export class GmailService {
  /**
   * Dispatches an approved email via the user's authentic Gmail OAuth connection.
   * Enforces tenant isolation, explicit human approval, suppression list verification,
   * duplicate prevention, and accurate GMAIL_ACCEPTED dispatch tracking.
   */
  public static async sendApprovedEmail(generatedEmailId: string, userId: string) {
    const emailRecord = await prisma.generatedEmail.findUnique({
      where: { id: generatedEmailId },
      include: {
        recipient: true,
        campaign: true,
        user: {
          select: { id: true, status: true, email: true, fullName: true },
        },
      },
    });

    if (!emailRecord) {
      throw new Error(`Generated email record ${generatedEmailId} not found.`);
    }

    // 1. Strict Tenant Isolation Check
    if (emailRecord.userId !== userId) {
      throw new Error('Tenant Violation: Unauthorized attempt to access another user\'s email.');
    }

    // 2. Strict Account Active Check
    if (emailRecord.user.status !== 'ACTIVE') {
      throw new Error('Account Deactivated: Inactive accounts cannot dispatch emails.');
    }

    // 3. Strict Human Approval Gate Check
    const isApproved =
      emailRecord.status === 'APPROVED' || emailRecord.approvalStatus === 'APPROVED';

    if (!isApproved) {
      throw new Error(
        `Safety Guardrail Violation: Email status is "${emailRecord.status || emailRecord.approvalStatus}". Explicit approval is required before sending.`
      );
    }

    // 4. Duplicate Dispatch Prevention
    const alreadySent = await prisma.sentEmail.findFirst({
      where: {
        userId,
        recipientId: emailRecord.recipientId,
        subject: emailRecord.subject,
        status: 'GMAIL_ACCEPTED',
      },
    });

    if (alreadySent && alreadySent.gmailMessageId) {
      throw new Error(
        `Duplicate Prevention: An email with identical subject was already dispatched to ${emailRecord.recipient.email} (Gmail ID: ${alreadySent.gmailMessageId}).`
      );
    }

    // 5. Suppression List Verification
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

    // 6. User-Specific Authenticated Gmail Client
    const { oauth2Client, senderEmail, senderName } =
      await GoogleOAuthService.getAuthorizedClient(userId);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 7. Deliverability-Optimized RFC 5322 MIME Email (Plain-Text + HTML)
    const raw = buildRawEmail({
      to: emailRecord.recipient.email,
      from: senderEmail,
      fromName: senderName,
      subject: emailRecord.subject,
      bodyText: emailRecord.body,
      bodyHtml: emailRecord.bodyHtml || undefined,
    });

    logger.info(
      `Dispatching email ${generatedEmailId} to ${emailRecord.recipient.email} from ${senderEmail} (${senderName})...`
    );

    // Bounded retry execution for transient network glitches
    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw },
        });

        const messageId = response.data.id || undefined;
        const threadId = response.data.threadId || undefined;

        // 8. Record in SentEmail table as GMAIL_ACCEPTED (never falsely claim "Inbox Delivery")
        const sentRecord = await prisma.sentEmail.create({
          data: {
            userId,
            campaignId: emailRecord.campaignId,
            recipientId: emailRecord.recipientId,
            subject: emailRecord.subject,
            gmailMessageId: messageId,
            gmailThreadId: threadId,
            status: 'GMAIL_ACCEPTED',
            sentAt: new Date(),
          },
        });

        // Update GeneratedEmail status
        await prisma.generatedEmail.update({
          where: { id: generatedEmailId },
          data: {
            status: 'GMAIL_ACCEPTED',
            approvalStatus: 'GMAIL_ACCEPTED',
            sentAt: new Date(),
          },
        });

        // 9. Audit Log
        await logAudit({
          actorUserId: userId,
          action: 'GMAIL_DISPATCH_ACCEPTED',
          targetUserId: userId,
          metadata: {
            generatedEmailId,
            sentEmailId: sentRecord.id,
            to: emailRecord.recipient.email,
            senderEmail,
            gmailMessageId: messageId,
          },
        });

        logger.info(
          `Email ${generatedEmailId} accepted by Gmail API for dispatch. MessageId: ${messageId}`
        );

        return {
          success: true,
          status: 'GMAIL_ACCEPTED',
          messageId,
          threadId,
          deliveryDisclaimer:
            'Accepted by Gmail API for dispatch. Inbox placement is determined by recipient email providers.',
        };
      } catch (err: any) {
        lastError = err;
        logger.warn(`Gmail API send attempt ${attempt}/3 failed: ${err.message}`);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
      }
    }

    // If all retries failed
    logger.error(`Failed to dispatch email ${generatedEmailId} after 3 attempts:`, lastError);

    await prisma.sentEmail.create({
      data: {
        userId,
        campaignId: emailRecord.campaignId,
        recipientId: emailRecord.recipientId,
        subject: emailRecord.subject,
        status: 'FAILED',
        errorMessage: lastError?.message || 'Gmail dispatch failed',
      },
    });

    await prisma.generatedEmail.update({
      where: { id: generatedEmailId },
      data: {
        status: 'FAILED',
        approvalStatus: 'FAILED',
      },
    });

    throw new Error(`Gmail API dispatch failed: ${lastError?.message || 'Unknown error'}`);
  }
}
