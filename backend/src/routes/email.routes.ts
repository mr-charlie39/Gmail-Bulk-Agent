import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.post('/send/:id', EmailController.sendEmail);
router.post('/batch-send', EmailController.batchSend);

export default router;
