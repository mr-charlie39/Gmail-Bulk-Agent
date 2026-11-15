import { Router } from 'express';
import { RecipientController } from '../controllers/recipient.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', RecipientController.list);
router.post('/', RecipientController.create);
router.post('/batch', RecipientController.batchCreate);
router.delete('/:id', RecipientController.delete);

export default router;
