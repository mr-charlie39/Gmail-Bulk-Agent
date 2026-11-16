import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

router.get('/', ProfileController.getProfile);
router.put('/', ProfileController.updateProfile);

export default router;
