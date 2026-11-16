import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthRequest } from '../types';
import { logAudit } from '../utils/auditLogger';

const createUserSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  email: z.string().email('Valid email required'),
  initialPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export class AdminController {
  /**
   * Platform-wide Dashboard Statistics
   * GET /api/admin/dashboard
   */
  public static async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        connectedGmailAccounts,
        totalCampaigns,
        totalGenerated,
        totalSent,
        totalFailed,
        pendingApprovals,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.user.count({ where: { role: 'USER', status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'USER', status: 'INACTIVE' } }),
        prisma.gmailConnection.count({ where: { connected: true } }),
        prisma.campaign.count(),
        prisma.generatedEmail.count(),
        prisma.sentEmail.count({ where: { status: { in: ['SENT', 'GMAIL_ACCEPTED'] } } }),
        prisma.sentEmail.count({ where: { status: 'FAILED' } }),
        prisma.generatedEmail.count({ where: { approvalStatus: { in: ['PENDING_APPROVAL', 'DRAFT', 'QUALITY_CHECKED'] } } }),
      ]);

      const recentAuditLogs = await prisma.auditLog.findMany({
        include: {
          actor: { select: { fullName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      });

      res.json({
        stats: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          connectedGmailAccounts,
          totalCampaigns,
          totalGenerated,
          totalSent,
          totalFailed,
          pendingApprovals,
        },
        recentAuditLogs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List All Registered Users with Statistics & Status Filter
   * GET /api/admin/users
   */
  public static async listUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const role = req.query.role as string | undefined;

      const where: any = {};
      if (status && (status === 'ACTIVE' || status === 'INACTIVE')) {
        where.status = status;
      }
      if (role && (role === 'ADMIN' || role === 'USER')) {
        where.role = role;
      }
      if (search && typeof search === 'string') {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          mustChangePassword: true,
          createdAt: true,
          lastLoginAt: true,
          gmailConnection: {
            select: {
              gmailAddress: true,
              connected: true,
              tokenVersion: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              campaigns: true,
              sentEmails: true,
              recipients: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Employee Account
   * POST /api/admin/users
   */
  public static async createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createUserSchema.parse(req.body);
      const email = validated.email.trim().toLowerCase();

      // Check duplicate email
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        res.status(409).json({ error: `An account with email ${email} already exists.` });
        return;
      }

      // Hash password with bcrypt work factor 12
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(validated.initialPassword, saltRounds);

      const newUser = await prisma.user.create({
        data: {
          fullName: validated.fullName.trim(),
          email,
          passwordHash,
          role: validated.role,
          status: validated.status,
          mustChangePassword: true, // Enforce password change on first login
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          mustChangePassword: true,
          createdAt: true,
        },
      });

      // Audit log
      await logAudit({
        actorUserId: req.user!.id,
        action: 'USER_CREATED',
        targetUserId: newUser.id,
        metadata: {
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
        },
        req,
      });

      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * View User Details
   * GET /api/admin/users/:id
   */
  public static async getUserDetails(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          mustChangePassword: true,
          createdAt: true,
          lastLoginAt: true,
          gmailConnection: {
            select: {
              gmailAddress: true,
              connected: true,
              tokenVersion: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              campaigns: true,
              sentEmails: true,
              generatedEmails: true,
              recipients: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update User
   * PATCH /api/admin/users/:id
   */
  public static async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validated = updateUserSchema.parse(req.body);

      const user = await prisma.user.update({
        where: { id },
        data: validated,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          mustChangePassword: true,
          updatedAt: true,
        },
      });

      await logAudit({
        actorUserId: req.user!.id,
        action: 'USER_UPDATED',
        targetUserId: user.id,
        metadata: validated,
        req,
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate / Deactivate User
   * PATCH /api/admin/users/:id/status
   */
  public static async toggleUserStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (status !== 'ACTIVE' && status !== 'INACTIVE') {
        res.status(400).json({ error: 'Status must be ACTIVE or INACTIVE.' });
        return;
      }

      // Prevent deactivating own admin account
      if (id === req.user!.id && status === 'INACTIVE') {
        res.status(400).json({ error: 'You cannot deactivate your own administrator account.' });
        return;
      }

      const user = await prisma.user.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
        },
      });

      await logAudit({
        actorUserId: req.user!.id,
        action: status === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        targetUserId: user.id,
        metadata: { newStatus: status },
        req,
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset User Password by Administrator
   * POST /api/admin/users/:id/reset-password
   */
  public static async resetUserPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { newPassword } = req.body;

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        res.status(400).json({ error: 'Temporary password must be at least 8 characters long.' });
        return;
      }

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      const user = await prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          mustChangePassword: true, // Forces employee to change password on next login
        },
        select: {
          id: true,
          email: true,
          mustChangePassword: true,
        },
      });

      await logAudit({
        actorUserId: req.user!.id,
        action: 'PASSWORD_RESET_BY_ADMIN',
        targetUserId: user.id,
        req,
      });

      res.json({
        success: true,
        message: `Password for ${user.email} reset successfully. User will be required to change it upon login.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete User Account
   * DELETE /api/admin/users/:id
   */
  public static async deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      if (id === req.user!.id) {
        res.status(400).json({ error: 'You cannot delete your own administrator account.' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      await prisma.user.delete({ where: { id } });

      await logAudit({
        actorUserId: req.user!.id,
        action: 'USER_DELETED',
        targetUserId: id,
        metadata: { deletedEmail: user.email },
        req,
      });

      res.json({ success: true, message: `User ${user.email} deleted successfully.` });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Monitored Gmail Accounts across platform
   * GET /api/admin/gmail-accounts
   */
  public static async listGmailAccounts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const connections = await prisma.gmailConnection.findMany({
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              status: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Safe view: never exposes encryptedRefreshToken, iv, or authTag to admin!
      const safeConnections = connections.map((c) => ({
        id: c.id,
        userId: c.userId,
        employeeName: c.user.fullName,
        employeeLoginEmail: c.user.email,
        employeeStatus: c.user.status,
        gmailAddress: c.gmailAddress,
        connected: c.connected,
        tokenVersion: c.tokenVersion,
        lastVerified: c.updatedAt,
      }));

      res.json(safeConnections);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Platform-wide Audit Logs
   * GET /api/admin/audit-logs
   */
  public static async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit as string | undefined;
      const action = req.query.action as string | undefined;

      const where: any = {};
      if (action && typeof action === 'string') {
        where.action = action;
      }

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { fullName: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit || '50', 10) || 50,
      });

      res.json(logs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Aggregated Campaign Monitoring
   * GET /api/admin/campaigns
   */
  public static async listAllCampaigns(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaigns = await prisma.campaign.findMany({
        include: {
          user: {
            select: { fullName: true, email: true },
          },
          _count: {
            select: {
              generatedEmails: true,
              sentEmails: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(campaigns);
    } catch (error) {
      next(error);
    }
  }
}
