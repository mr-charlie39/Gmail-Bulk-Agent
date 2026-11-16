import { Router } from 'express';
import { ComposerController } from '../controllers/composer.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

router.get('/templates', ComposerController.getTemplates);
router.post('/templates', ComposerController.createCustomTemplate);
router.delete('/templates/:id', ComposerController.deleteCustomTemplate);

router.post('/generate', ComposerController.generateDraft);
router.post('/batch-generate', ComposerController.batchGenerate);
router.post('/check-slop', ComposerController.checkCopyQuality);

router.put('/drafts/:id', ComposerController.updateDraft);
router.post('/drafts/:id/approve', ComposerController.approveDraft);

export default router;
