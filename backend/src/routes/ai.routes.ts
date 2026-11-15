import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.post('/generate', AIController.generateDraft);
router.post('/batch-generate', AIController.batchGenerate);

export default router;
