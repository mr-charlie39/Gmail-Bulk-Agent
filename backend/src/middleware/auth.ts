import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { AuthRequest, Role, AccountStatus } from '../types';

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

/**
 * Authenticates user via HTTP-only cookie 'access_token' or Authorization Bearer header
 */
export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check HTTP-only cookie first
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    // 2. Check Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required. No session or token found.' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Account not found or session revoked.' });
      return;
    }

    req.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role as Role,
      status: user.status as AccountStatus,
      mustChangePassword: user.mustChangePassword,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid or expired authentication session.' });
  }
};

// Alias for backwards compatibility
export const requireAuth = authenticateUser;

/**
 * Ensures user account is in ACTIVE status
 */
export const requireActiveAccount = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (req.user.status !== 'ACTIVE') {
    res.status(403).json({
      error: 'Your account has been deactivated. Please contact your system administrator.',
      code: 'ACCOUNT_INACTIVE',
    });
    return;
  }

  next();
};

/**
 * Restricts access to ADMIN role only
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      error: 'Access denied: Administrator privileges required.',
      code: 'FORBIDDEN_ADMIN_ONLY',
    });
    return;
  }

  next();
};

/**
 * Restricts access to USER (Employee) role only
 */
export const requireUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'USER') {
    res.status(403).json({
      error: 'Access denied: Employee workspace privileges required.',
      code: 'FORBIDDEN_USER_ONLY',
    });
    return;
  }

  next();
};

/**
 * Enforces password change on first login before accessing functional features
 */
export const requirePasswordChangeCompleted = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.mustChangePassword) {
    res.status(403).json({
      error: 'Password change is required before proceeding.',
      code: 'MUST_CHANGE_PASSWORD',
    });
    return;
  }

  next();
};
