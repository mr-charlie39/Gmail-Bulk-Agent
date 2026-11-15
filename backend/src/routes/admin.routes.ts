import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateUser, requireActiveAccount, requireAdmin } from '../middleware/auth';

const router = Router();

// Strict RBAC Middleware for all admin endpoints
router.use(authenticateUser);
router.use(requireActiveAccount);
router.use(requireAdmin);

// Dashboard stats
router.get('/dashboard', AdminController.getDashboardStats);

// User Management
router.get('/users', AdminController.listUsers);
router.post('/users', AdminController.createUser);
router.get('/users/:id', AdminController.getUserDetails);
router.patch('/users/:id', AdminController.updateUser);
router.patch('/users/:id/status', AdminController.toggleUserStatus);
router.post('/users/:id/reset-password', AdminController.resetUserPassword);
router.delete('/users/:id', AdminController.deleteUser);

// Platform Monitoring
router.get('/gmail-accounts', AdminController.listGmailAccounts);
router.get('/campaigns', AdminController.listAllCampaigns);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
