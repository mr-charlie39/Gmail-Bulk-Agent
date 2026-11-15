import { Router } from 'express';
import { ApprovalController } from '../controllers/approval.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/pending', ApprovalController.getPending);
router.put('/:id/update', ApprovalController.updateDraft);
router.post('/:id/approve', ApprovalController.approve);
router.post('/:id/reject', ApprovalController.reject);
router.post('/batch-approve', ApprovalController.batchApprove);

export default router;
