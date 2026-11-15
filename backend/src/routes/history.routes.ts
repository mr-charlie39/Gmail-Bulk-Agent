import { Router } from 'express';
import { HistoryController } from '../controllers/history.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', HistoryController.list);
router.get('/:id', HistoryController.getDetail);

export default router;
