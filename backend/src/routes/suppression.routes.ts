import { Router } from 'express';
import { SuppressionController } from '../controllers/suppression.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', SuppressionController.list);
router.post('/', SuppressionController.add);
router.delete('/', SuppressionController.remove);

export default router;
