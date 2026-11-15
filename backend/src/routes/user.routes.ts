import { Router } from 'express';
import { authenticateUser, requireActiveAccount, requireUser } from '../middleware/auth';
import { UserDashboardController } from '../controllers/userDashboard.controller';
import { RecipientController } from '../controllers/recipient.controller';
import { CampaignController } from '../controllers/campaign.controller';
import { AIController } from '../controllers/ai.controller';
import { ApprovalController } from '../controllers/approval.controller';
import { EmailController } from '../controllers/email.controller';
import { HistoryController } from '../controllers/history.controller';
import { SuppressionController } from '../controllers/suppression.controller';

const router = Router();

// Strict RBAC: All /api/user/* endpoints require active USER authentication
router.use(authenticateUser);
router.use(requireActiveAccount);
router.use(requireUser);

// 1. User Dashboard & Stats
router.get('/dashboard', UserDashboardController.getDashboard);

// 2. Recipients
router.get('/recipients', RecipientController.list);
router.post('/recipients', RecipientController.create);
router.post('/recipients/batch', RecipientController.batchCreate);
router.delete('/recipients/:id', RecipientController.delete);

// 3. Campaigns
router.get('/campaigns', CampaignController.list);
router.get('/campaigns/:id', CampaignController.getById);
router.post('/campaigns', CampaignController.create);
router.put('/campaigns/:id', CampaignController.update);
router.delete('/campaigns/:id', CampaignController.delete);
router.post('/campaigns/:id/send', UserDashboardController.sendCampaignEmails);

// 4. AI Email Generation
router.post('/emails/generate', AIController.generateDraft);
router.post('/emails/batch-generate', AIController.batchGenerate);

// 5. Approval Queue
router.get('/approvals', ApprovalController.getPending);
router.put('/approvals/:id', ApprovalController.updateDraft);
router.post('/approvals/:id/approve', ApprovalController.approve);
router.post('/approvals/:id/reject', ApprovalController.reject);
router.post('/approvals/batch-approve', ApprovalController.batchApprove);

// 6. Email Sending
router.post('/emails/send/:id', EmailController.sendEmail);
router.post('/emails/batch-send', EmailController.batchSend);

// 7. Delivery History
router.get('/history', HistoryController.list);
router.get('/history/:id', HistoryController.getDetail);

// 8. Suppression List
router.get('/suppression', SuppressionController.list);
router.post('/suppression', SuppressionController.add);
router.delete('/suppression', SuppressionController.remove);

export default router;
