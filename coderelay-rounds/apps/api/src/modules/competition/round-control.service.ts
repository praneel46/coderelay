import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompetitionGateway } from './competition.gateway';

@Injectable()
export class RoundControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly competitionGateway: CompetitionGateway,
  ) {}

  /**
   * STEP 1 — LOAD ROUND (Staging)
   */
  async loadRound(roundNumber: number, actorUser: { id: string; username: string; role: string }) {
    const round = await this.prisma.round.findUnique({ where: { roundNumber } });
    if (!round) throw new NotFoundException(`Round ${roundNumber} not found`);

    let eligibleTeamsCount = 0;
    if (roundNumber === 1) {
      eligibleTeamsCount = await this.prisma.team.count({ where: { isActive: true } });
    } else if (roundNumber === 2) {
      eligibleTeamsCount = await this.prisma.team.count({ where: { isQualifiedR2: true, isActive: true } });
    } else {
      eligibleTeamsCount = await this.prisma.team.count({ where: { isActive: true } });
    }

    const updatedRound = await this.prisma.round.update({
      where: { roundNumber },
      data: { status: 'READY' },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actorUser.id,
        actorUsername: actorUser.username,
        actorRole: actorUser.role as any,
        action: 'ROUND_LOADED',
        resource: 'Round',
        resourceId: round.id,
        metadata: { roundNumber, eligibleTeamsCount, status: 'READY' },
      },
    });

    this.competitionGateway.broadcastRoundStateUpdate({
      event: 'ROUND_LOADED',
      roundId: round.id,
      state: 'READY' as any,
      timestamp: new Date().toISOString(),
      metadata: { roundNumber, eligibleTeamsCount, title: round.title },
    });

    return {
      message: `Round ${roundNumber} staged successfully.`,
      roundNumber,
      status: updatedRound.status,
      eligibleTeamsCount,
    };
  }

  /**
   * STEP 2 — START TIMER (Synchronized 5s Countdown + Live Start)
   */
  async startTimer(roundNumber: number, actorUser: { id: string; username: string; role: string }) {
    const round = await this.prisma.round.findUnique({
      where: { roundNumber },
      include: { stages: { orderBy: { stageOrder: 'asc' } } },
    });
    if (!round) throw new NotFoundException(`Round ${roundNumber} not found`);

    const now = new Date();
    const countdownStartedAt = now;
    const competitionStartedAt = new Date(now.getTime() + 5000); // 5-second countdown offset
    const durationMs = round.durationSeconds * 1000;
    const deadlineAt = new Date(competitionStartedAt.getTime() + durationMs);

    const updatedRound = await this.prisma.round.update({
      where: { roundNumber },
      data: {
        status: 'ACTIVE',
        startedAt: competitionStartedAt,
        pausedAt: null,
      },
    });

    // If Round 2, initialize Stage 1 sessions for all qualified teams
    if (roundNumber === 2) {
      const qualifiedTeams = await this.prisma.team.findMany({
        where: { isQualifiedR2: true, isActive: true },
        include: { members: { orderBy: { memberOrder: 'asc' } } },
      });

      const stage1 = round.stages.find((s) => s.stageOrder === 1);
      if (stage1) {
        const stage1Deadline = new Date(competitionStartedAt.getTime() + stage1.durationSeconds * 1000);
        for (const team of qualifiedTeams) {
          const m1 = team.members.find((m) => m.memberOrder === 1);
          const existingSession = await this.prisma.stageSession.findFirst({
            where: { teamId: team.id, stageId: stage1.id },
          });

          if (existingSession) {
            await this.prisma.stageSession.update({
              where: { id: existingSession.id },
              data: {
                status: 'ACTIVE',
                startedAt: competitionStartedAt,
                deadlineAt: stage1Deadline,
                warningCount: 0,
                isSubmitted: false,
                isAutoSubmitted: false,
              } as any,
            });
          } else {
            await this.prisma.stageSession.create({
              data: {
                stageId: stage1.id,
                teamId: team.id,
                memberId: m1?.id,
                status: 'ACTIVE',
                startedAt: competitionStartedAt,
                deadlineAt: stage1Deadline,
              },
            });
          }
        }
      }
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: actorUser.id,
        actorUsername: actorUser.username,
        actorRole: actorUser.role as any,
        action: 'ROUND_STARTED',
        resource: 'Round',
        resourceId: round.id,
        metadata: {
          roundNumber,
          countdownStartedAt: countdownStartedAt.toISOString(),
          competitionStartedAt: competitionStartedAt.toISOString(),
          deadlineAt: deadlineAt.toISOString(),
        },
      },
    });

    this.competitionGateway.broadcastRoundStateUpdate({
      event: 'ROUND2_STARTED',
      roundId: round.id,
      state: 'ACTIVE' as any,
      startedAt: competitionStartedAt.toISOString(),
      deadlineAt: deadlineAt.toISOString(),
      timestamp: new Date().toISOString(),
      metadata: {
        roundNumber,
        countdownStartedAt: countdownStartedAt.toISOString(),
        competitionStartedAt: competitionStartedAt.toISOString(),
      },
    });

    return {
      message: `Round ${roundNumber} timer started. Synchronized 5s countdown initiated.`,
      roundNumber,
      countdownStartedAt,
      competitionStartedAt,
      deadlineAt,
    };
  }

  /**
   * PAUSE ROUND (Server Authoritative)
   */
  async pauseRound(roundNumber: number, actorUser: { id: string; username: string; role: string }) {
    const round = await this.prisma.round.findUnique({ where: { roundNumber } });
    if (!round) throw new NotFoundException(`Round ${roundNumber} not found`);
    if (round.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot pause Round ${roundNumber} because status is ${round.status}`);
    }

    const now = new Date();
    const updatedRound = await this.prisma.round.update({
      where: { roundNumber },
      data: {
        status: 'PAUSED',
        pausedAt: now,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actorUser.id,
        actorUsername: actorUser.username,
        actorRole: actorUser.role as any,
        action: 'ROUND_PAUSED',
        resource: 'Round',
        resourceId: round.id,
        metadata: { roundNumber, pausedAt: now.toISOString() },
      },
    });

    this.competitionGateway.broadcastRoundStateUpdate({
      event: 'ROUND_PAUSED',
      roundId: round.id,
      state: 'PAUSED' as any,
      timestamp: now.toISOString(),
      metadata: { roundNumber, pausedAt: now.toISOString() },
    });

    return {
      message: `Round ${roundNumber} PAUSED successfully.`,
      roundNumber,
      status: updatedRound.status,
      pausedAt: now,
    };
  }

  /**
   * RESUME ROUND (Preserves authoritative remaining time by shifting deadlineAt)
   */
  async resumeRound(roundNumber: number, actorUser: { id: string; username: string; role: string }) {
    const round = await this.prisma.round.findUnique({
      where: { roundNumber },
      include: { stages: true },
    });
    if (!round) throw new NotFoundException(`Round ${roundNumber} not found`);
    if (round.status !== 'PAUSED' || !round.pausedAt) {
      throw new BadRequestException(`Cannot resume Round ${roundNumber} because it is not in PAUSED state`);
    }

    const now = new Date();
    const pauseDurationMs = now.getTime() - round.pausedAt.getTime();

    // Adjust deadline for active StageSessions in Round 2 / Round 1
    if (roundNumber === 2) {
      const activeSessions = await this.prisma.stageSession.findMany({
        where: { status: 'ACTIVE', deadlineAt: { not: null } },
      });

      for (const session of activeSessions) {
        if (session.deadlineAt) {
          const newDeadline = new Date(session.deadlineAt.getTime() + pauseDurationMs);
          await this.prisma.stageSession.update({
            where: { id: session.id },
            data: { deadlineAt: newDeadline },
          });
        }
      }
    }

    const updatedRound = await this.prisma.round.update({
      where: { roundNumber },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actorUser.id,
        actorUsername: actorUser.username,
        actorRole: actorUser.role as any,
        action: 'ROUND_RESUMED',
        resource: 'Round',
        resourceId: round.id,
        metadata: { roundNumber, pauseDurationMs, resumedAt: now.toISOString() },
      },
    });

    this.competitionGateway.broadcastRoundStateUpdate({
      event: 'ROUND_RESUMED',
      roundId: round.id,
      state: 'ACTIVE' as any,
      timestamp: now.toISOString(),
      metadata: { roundNumber, pauseDurationMs, resumedAt: now.toISOString() },
    });

    return {
      message: `Round ${roundNumber} RESUMED successfully. Pause duration of ${Math.round(pauseDurationMs / 1000)}s accounted for.`,
      roundNumber,
      status: updatedRound.status,
      pauseDurationMs,
    };
  }

  /**
   * END ROUND (Explicit Transactional Finalization)
   */
  async endRound(roundNumber: number, actorUser: { id: string; username: string; role: string }) {
    const round = await this.prisma.round.findUnique({ where: { roundNumber } });
    if (!round) throw new NotFoundException(`Round ${roundNumber} not found`);

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.round.update({
        where: { roundNumber },
        data: { status: 'FINALIZED', endedAt: now, pausedAt: null },
      });

      if (roundNumber === 2) {
        await tx.stageSession.updateMany({
          where: { status: 'ACTIVE' },
          data: { status: 'SUBMITTED', endedAt: now, isFinal: true },
        });
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actorUser.id,
        actorUsername: actorUser.username,
        actorRole: actorUser.role as any,
        action: 'ROUND_ENDED',
        resource: 'Round',
        resourceId: round.id,
        metadata: { roundNumber, endedAt: now.toISOString() },
      },
    });

    this.competitionGateway.broadcastRoundStateUpdate({
      event: 'ROUND_ENDED',
      roundId: round.id,
      state: 'COMPLETE' as any,
      timestamp: now.toISOString(),
      metadata: { roundNumber },
    });

    return {
      message: `Round ${roundNumber} explicitly ended and finalized by organizer.`,
      roundNumber,
      status: 'FINALIZED',
      endedAt: now,
    };
  }

  /**
   * RESET ROUND (Dangerous Action with Explicit Confirmation Payload)
   */
  async resetRound(
    roundNumber: number,
    confirmationCode: string,
    actorUser: { id: string; username: string; role: string },
  ) {
    if (confirmationCode !== 'RESET_ROUND_CONFIRM') {
      throw new BadRequestException(
        'Invalid confirmation code for resetting round. Must provide "RESET_ROUND_CONFIRM".',
      );
    }

    const round = await this.prisma.round.findUnique({ where: { roundNumber } });
    if (!round) throw new NotFoundException(`Round ${roundNumber} not found`);

    await this.prisma.$transaction(async (tx) => {
      await tx.round.update({
        where: { roundNumber },
        data: {
          status: 'DRAFT',
          startedAt: null,
          endedAt: null,
          pausedAt: null,
        },
      });

      if (roundNumber === 2) {
        const stageIds = (await tx.roundStage.findMany({ where: { roundId: round.id } })).map((s) => s.id);
        await tx.stageSession.deleteMany({
          where: { stageId: { in: stageIds } },
        });
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: actorUser.id,
        actorUsername: actorUser.username,
        actorRole: actorUser.role as any,
        action: 'ROUND_RESET',
        resource: 'Round',
        resourceId: round.id,
        metadata: { roundNumber, confirmationCode },
      },
    });

    this.competitionGateway.broadcastRoundStateUpdate({
      event: 'ROUND_RESET',
      roundId: round.id,
      state: 'DRAFT' as any,
      timestamp: new Date().toISOString(),
      metadata: { roundNumber },
    });

    return {
      message: `Round ${roundNumber} successfully reset to DRAFT state. Audit log recorded.`,
      roundNumber,
      status: 'DRAFT',
    };
  }
}
