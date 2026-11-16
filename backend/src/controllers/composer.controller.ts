import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../types';
import { EmailTemplateService } from '../services/emailTemplateService';
import { SlopMonsterService } from '../services/slopMonsterService';
import { logAudit } from '../utils/auditLogger';

export class ComposerController {
  /**
   * Retrieves all available templates for the user
   * GET /api/composer/templates
   */
  public static async getTemplates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const templates = await EmailTemplateService.getTemplatesForUser(userId);
      res.json(templates);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deterministically composes an email draft with SlopMonster quality check
   * POST /api/composer/generate
   */
  public static async generateDraft(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { recipientId, templateKeyOrId, customInstructions, campaignId } = req.body;

      if (!recipientId) {
        res.status(400).json({ error: 'recipientId is required' });
        return;
      }

      const result = await EmailTemplateService.generateDraft({
        recipientId,
        userId,
        templateKeyOrId,
        customInstructions,
        campaignId,
      });

      res.status(201).json({
        ...result,
        draft: result.generatedEmail,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch generates drafts for multiple recipients
   * POST /api/composer/batch-generate
   */
  public static async batchGenerate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { recipientIds, templateKeyOrId, customInstructions, campaignId } = req.body;

      if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
        res.status(400).json({ error: 'recipientIds array is required' });
        return;
      }

      const results = await EmailTemplateService.batchGenerate({
        recipientIds,
        userId,
        templateKeyOrId,
        customInstructions,
        campaignId,
      });

      res.json({ results });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Runs SlopMonster quality check on arbitrary subject/body copy
   * POST /api/composer/check-slop
   */
  public static async checkCopyQuality(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subject, bodyText, text, allowProof } = req.body;
      const content = text || `${subject ? `${subject}\n\n` : ''}${bodyText || ''}`;

      if (!content || !content.trim()) {
        res.status(400).json({ error: 'Text or subject/bodyText required for quality check' });
        return;
      }

      const result = await SlopMonsterService.checkCopy(content, { allowProof: !!allowProof });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing draft's subject and/or body, re-scoring with SlopMonster
   * PUT /api/composer/drafts/:id
   */
  public static async updateDraft(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const draftId = req.params.id as string;
      const { subject, bodyText, allowProof } = req.body;

      const existing = await prisma.generatedEmail.findUnique({
        where: { id: draftId },
      });

      if (!existing || existing.userId !== userId) {
        res.status(404).json({ error: 'Draft not found or unauthorized access.' });
        return;
      }

      const newSubject = subject !== undefined ? subject.trim() : existing.subject;
      const newBody = bodyText !== undefined ? bodyText.trim() : existing.body;
      const newHtml = `<div>${newBody.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}</div>`;

      // Re-run SlopMonster check on revised copy
      const slopResult = await SlopMonsterService.checkCopy(`${newSubject}\n\n${newBody}`, {
        allowProof: !!allowProof,
      });

      const updated = await prisma.generatedEmail.update({
        where: { id: draftId },
        data: {
          subject: newSubject,
          body: newBody,
          bodyHtml: newHtml,
          slopScore: slopResult.score,
          slopClean: slopResult.clean,
          slopReport: slopResult.rawReport,
          status: 'PENDING_APPROVAL',
          approvalStatus: 'PENDING_APPROVAL',
        },
        include: {
          recipient: true,
          campaign: true,
        },
      });

      const enriched = {
        ...updated,
        bodyText: updated.body,
      };

      res.json({
        draft: enriched,
        generatedEmail: enriched,
        slopResult,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Explicitly approves an email draft for sending
   * POST /api/composer/drafts/:id/approve
   */
  public static async approveDraft(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const draftId = req.params.id as string;
      const { sendImmediately } = req.body;

      const existing = await prisma.generatedEmail.findUnique({
        where: { id: draftId },
      });

      if (!existing || existing.userId !== userId) {
        res.status(404).json({ error: 'Draft not found or unauthorized access.' });
        return;
      }

      const approved = await prisma.generatedEmail.update({
        where: { id: draftId },
        data: {
          status: 'APPROVED',
          approvalStatus: 'APPROVED',
          approvedAt: new Date(),
        },
        include: {
          recipient: true,
          campaign: true,
        },
      });

      await logAudit({
        actorUserId: userId,
        action: 'EMAIL_APPROVED',
        targetUserId: userId,
        metadata: { draftId, recipientEmail: approved.recipient.email },
      });

      if (sendImmediately) {
        const { GmailService } = await import('../services/gmail.service');
        const sendResult = await GmailService.sendApprovedEmail(draftId, userId);
        res.json({ approved, dispatched: true, sendResult });
        return;
      }

      res.json({ approved, dispatched: false });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Creates a user custom template
   * POST /api/composer/templates
   */
  public static async createCustomTemplate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        name,
        category,
        description,
        subjectTemplate,
        openingSentence,
        reasonForContact,
        relevantService,
        portfolioInfo,
        naturalClosing,
      } = req.body;

      if (!name || !subjectTemplate || !reasonForContact || !relevantService) {
        res.status(400).json({ error: 'Name, subjectTemplate, reasonForContact, and relevantService are required.' });
        return;
      }

      const template = await prisma.emailTemplate.create({
        data: {
          userId,
          name: name.trim(),
          category: category ? category.trim() : 'CUSTOM',
          description: description?.trim(),
          subjectTemplate: subjectTemplate.trim(),
          openingSentence: openingSentence?.trim() || 'Hi {{recipientName}},',
          reasonForContact: reasonForContact.trim(),
          relevantService: relevantService.trim(),
          portfolioInfo: portfolioInfo?.trim() || '',
          naturalClosing: naturalClosing?.trim() || 'Best regards,',
          isCustom: true,
        },
      });

      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a user custom template
   * DELETE /api/composer/templates/:id
   */
  public static async deleteCustomTemplate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const template = await prisma.emailTemplate.findUnique({ where: { id } });
      if (!template || template.userId !== userId) {
        res.status(404).json({ error: 'Template not found or unauthorized access.' });
        return;
      }

      await prisma.emailTemplate.delete({ where: { id } });
      res.json({ success: true, message: 'Custom template deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
}
