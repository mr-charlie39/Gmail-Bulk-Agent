import { Router } from 'express';
import { GoogleAuthController } from '../controllers/googleAuth.controller';
import { authenticateUser, requireActiveAccount } from '../middleware/auth';

const router = Router();

// OAuth initiation (bound to logged-in user)
router.get('/google', authenticateUser, requireActiveAccount, GoogleAuthController.initiateAuth);
router.get('/google/callback', GoogleAuthController.handleCallback);

// Account connection status and disconnect
router.get('/google/status', authenticateUser, requireActiveAccount, GoogleAuthController.getStatus);
router.post('/google/disconnect', authenticateUser, requireActiveAccount, GoogleAuthController.disconnect);

export default router;
