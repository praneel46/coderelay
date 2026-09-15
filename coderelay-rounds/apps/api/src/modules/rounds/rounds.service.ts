import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, RoundStatus } from '@prisma/client';

export interface UpdateRoundDto {
  title?: string;
  timeLimitSec?: number;
  status?: RoundStatus;
}

@Injectable()
export class RoundsService {
  private readonly logger = new Logger(RoundsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getAllRounds() {
    return this.prisma.round.findMany({
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' },
        },
        _count: {
          select: { questions: true, submissions: true },
        },
      },
      orderBy: { roundNumber: 'asc' },
    });
  }

  async getRoundById(id: string) {
    const round = await this.prisma.round.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' },
        },
        questions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!round) {
      throw new NotFoundException(`Round with ID ${id} not found`);
    }

    return round;
  }

  async updateRound(id: string, dto: UpdateRoundDto, actorUsername: string) {
    const existing = await this.prisma.round.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Round with ID ${id} not found`);
    }

    const round = await this.prisma.round.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        durationSeconds: dto.timeLimitSec ?? existing.durationSeconds,
        status: dto.status ?? existing.status,
      },
      include: { stages: true },
    });

    await this.auditService.logAction({
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'UPDATE_ROUND',
      resource: 'Round',
      resourceId: round.id,
      metadata: { roundNumber: round.roundNumber, changes: dto },
    });

    this.logger.log(`Organizer ${actorUsername} updated Round ${round.roundNumber}`);

    return round;
  }
}
