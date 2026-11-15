import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { AuthRequest } from '../types';
import { logAudit } from '../utils/auditLogger';

export class AuthController {
  /**
   * Unified Login for ADMIN and USER
   * POST /api/auth/login
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, rememberMe } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      // Check account status before verifying password
      if (user.status !== 'ACTIVE') {
        await logAudit({
          actorUserId: user.id,
          action: 'LOGIN_BLOCKED_INACTIVE',
          targetUserId: user.id,
          metadata: { email: normalizedEmail },
          req,
        });

        res.status(403).json({
          error: 'Your account has been deactivated. Please contact your administrator.',
          code: 'ACCOUNT_INACTIVE',
        });
        return;
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        await logAudit({
          actorUserId: user.id,
          action: 'LOGIN_FAILED_BAD_PASSWORD',
          targetUserId: user.id,
          metadata: { email: normalizedEmail },
          req,
        });

        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate JWT
      const expiresIn = rememberMe ? '30d' : '7d';
      const maxAgeMs = rememberMe ? 30 * 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000;

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        env.JWT_SECRET,
        { expiresIn }
      );

      // Set secure HTTP-only cookie
      res.cookie('access_token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: maxAgeMs,
        path: '/',
      });

      // Audit log
      await logAudit({
        actorUserId: user.id,
        action: user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'USER_LOGIN',
        targetUserId: user.id,
        metadata: {
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
        req,
      });

      res.json({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  public static async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      res.clearCookie('access_token', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      if (userId) {
        await logAudit({
          actorUserId: userId,
          action: 'LOGOUT',
          targetUserId: userId,
          req,
        });
      }

      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Current Authenticated User Profile
   * GET /api/auth/me
   */
  public static async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
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
              updatedAt: true,
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
   * Force Password Change (on first login or user preference)
   * POST /api/auth/change-password
   */
  public static async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required.' });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ error: 'New password must be at least 8 characters long.' });
        return;
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        res.status(400).json({ error: 'New password and confirmation do not match.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      // Verify current password
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        res.status(400).json({ error: 'Incorrect current password.' });
        return;
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: false, // Flag cleared
        },
      });

      await logAudit({
        actorUserId: userId,
        action: 'PASSWORD_CHANGED',
        targetUserId: userId,
        req,
      });

      res.json({
        success: true,
        message: 'Password changed successfully. Your account is now fully secured.',
      });
    } catch (error) {
      next(error);
    }
  }
}
