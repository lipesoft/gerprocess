import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export async function auditLog(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: string,
  req?: Request
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
        ipAddress: req?.ip || req?.socket.remoteAddress || 'unknown',
        userAgent: req?.headers['user-agent'] || 'unknown',
      },
    });
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
  }
}
