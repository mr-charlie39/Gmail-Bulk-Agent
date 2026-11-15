import { Router } from 'express';
import { CampaignController } from '../controllers/campaign.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/', CampaignController.list);
router.get('/:id', CampaignController.getById);
router.post('/', CampaignController.create);
router.put('/:id', CampaignController.update);
router.delete('/:id', CampaignController.delete);

export default router;
