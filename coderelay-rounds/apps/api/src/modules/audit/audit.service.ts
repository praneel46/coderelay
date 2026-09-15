import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

export interface CreateAuditLogDto {
  actorId?: string;
  actorUsername: string;
  actorRole: Role;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(dto: CreateAuditLogDto) {
    this.logger.log(
      `AUDIT [${dto.actorRole} ${dto.actorUsername}]: ${dto.action} on ${dto.resource}${dto.resourceId ? ` (${dto.resourceId})` : ''}`,
    );

    return this.prisma.auditLog.create({
      data: {
        actorId: dto.actorId,
        actorUsername: dto.actorUsername,
        actorRole: dto.actorRole,
        action: dto.action,
        resource: dto.resource,
        resourceId: dto.resourceId,
        metadata: dto.metadata || {},
      },
    });
  }

  async getRecentLogs(limit = 100) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
