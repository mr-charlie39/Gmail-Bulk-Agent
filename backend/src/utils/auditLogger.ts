import { Request } from 'express';
import { prisma } from '../config/db';
import { logger } from './logger';

export interface AuditLogParams {
  actorUserId?: string | null;
  action: string;
  targetUserId?: string | null;
  metadata?: Record<string, any>;
  req?: Request;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    let ipAddress = '127.0.0.1';
    if (params.req) {
      const forwarded = params.req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        ipAddress = forwarded.split(',')[0].trim();
      } else if (params.req.ip) {
        ipAddress = params.req.ip;
      }
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId || null,
        action: params.action,
        targetUserId: params.targetUserId || null,
        metadata: params.metadata || {},
        ipAddress,
      },
    });

    logger.info(`[AUDIT] Action: ${params.action} | Actor: ${params.actorUserId || 'ANONYMOUS'} | Target: ${params.targetUserId || 'N/A'}`);
  } catch (err: any) {
    logger.error('[AUDIT ERROR] Failed to record audit log:', err.message);
  }
}
