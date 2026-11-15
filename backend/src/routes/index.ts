import { Router } from 'express';
import authRoutes from './auth.routes';
import googleAuthRoutes from './googleAuth.routes';
import adminRoutes from './admin.routes';
import userRoutes from './user.routes';

// Existing modular routes for backward compatibility
import aiRoutes from './ai.routes';
import approvalRoutes from './approval.routes';
import emailRoutes from './email.routes';
import recipientRoutes from './recipient.routes';
import campaignRoutes from './campaign.routes';
import historyRoutes from './history.routes';
import analyticsRoutes from './analytics.routes';
import suppressionRoutes from './suppression.routes';

const router = Router();

// 1. Authentication (Admin & User login, logout, password change)
router.use('/auth', authRoutes);
router.use('/auth', googleAuthRoutes);

// 2. Strict Role-Based Portals
router.use('/admin', adminRoutes);
router.use('/user', userRoutes);

// 3. Modular Direct Routes (Protected via Authenticated User)
router.use('/ai', aiRoutes);
router.use('/approval', approvalRoutes);
router.use('/emails', emailRoutes);
router.use('/recipients', recipientRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/history', historyRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/suppression', suppressionRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'email-outreach-agent',
    architecture: 'multi-user-rbac',
  });
});

export default router;
