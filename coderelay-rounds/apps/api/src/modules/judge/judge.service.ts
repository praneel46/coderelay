import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CompetitionGateway } from '../competition/competition.gateway';
import { EvaluateTeamDto } from './dto/evaluate-team.dto';
import { Role } from '@prisma/client';

@Injectable()
export class JudgeService {
  private readonly logger = new Logger(JudgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly competitionGateway: CompetitionGateway,
  ) {}

  async getRounds() {
    const rounds = await this.prisma.round.findMany({
      orderBy: { roundNumber: 'asc' },
      select: {
        id: true,
        roundNumber: true,
        slug: true,
        title: true,
        description: true,
        status: true,
        durationSeconds: true,
        config: true,
      },
    });

    return rounds.map((r) => {
      const config = (r.config as any) || {};
      return {
        id: r.id,
        roundNumber: r.roundNumber,
        slug: r.slug,
        title: r.title,
        description: r.description,
        status: r.status,
        durationSeconds: r.durationSeconds,
        scoringType: config.scoringType || (r.roundNumber >= 3 ? 'JUDGE' : 'AUTOMATIC'),
      };
    });
  }

  async getTeamsForRound(roundNumber: number) {
    const round = await this.prisma.round.findUnique({
      where: { roundNumber },
    });

    if (!round) {
      throw new NotFoundException(`Round ${roundNumber} not found`);
    }

    const teams = await this.prisma.team.findMany({
      where: { isActive: true },
      include: {
        members: {
          select: {
            id: true,
            displayName: true,
            memberOrder: true,
          },
          orderBy: { memberOrder: 'asc' },
        },
        submissions: {
          where: {
            roundId: round.id,
            questionId: null,
          },
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { teamCode: 'asc' },
    });

    return teams.map((team) => {
      const evalSub = team.submissions[0] || null;
      return {
        id: team.id,
        teamCode: team.teamCode,
        name: team.name,
        isQualifiedR2: team.isQualifiedR2,
        isQualifiedR4: team.isQualifiedR4,
        members: team.members,
        evaluation: evalSub
          ? {
              score: evalSub.score,
              feedback: evalSub.answerText,
              evaluatedAt: evalSub.submittedAt,
            }
          : null,
      };
    });
  }

  async evaluateTeam(roundNumber: number, dto: EvaluateTeamDto, judgeUser: { id?: string; username: string; role: Role }) {
    if (dto.score < 0) {
      throw new BadRequestException('Score must be non-negative');
    }

    const round = await this.prisma.round.findUnique({
      where: { roundNumber },
    });

    if (!round) {
      throw new NotFoundException(`Round ${roundNumber} not found`);
    }

    const team = await this.prisma.team.findUnique({
      where: { id: dto.teamId },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${dto.teamId} not found`);
    }

    // Existing judge evaluation submission for this team & round
    const existingSub = await this.prisma.submission.findFirst({
      where: {
        teamId: team.id,
        roundId: round.id,
        questionId: null,
      },
    });

    let submission;
    if (existingSub) {
      submission = await this.prisma.submission.update({
        where: { id: existingSub.id },
        data: {
          score: dto.score,
          answerText: dto.feedback || null,
          isFinal: true,
          submittedAt: new Date(),
        },
      });
    } else {
      submission = await this.prisma.submission.create({
        data: {
          teamId: team.id,
          roundId: round.id,
          questionId: null,
          score: dto.score,
          answerText: dto.feedback || null,
          isFinal: true,
        },
      });
    }

    await this.auditService.logAction({
      actorUsername: judgeUser.username,
      actorRole: judgeUser.role,
      action: 'JUDGE_EVALUATE_TEAM',
      resource: 'Round',
      resourceId: round.id,
      metadata: {
        roundNumber,
        teamId: team.id,
        teamCode: team.teamCode,
        score: dto.score,
        feedback: dto.feedback,
      },
    });

    // Notify arena/host displays of score update
    this.competitionGateway.server.emit('leaderboard_updated', {
      roundNumber,
      teamId: team.id,
      teamCode: team.teamCode,
      score: dto.score,
    });

    return {
      success: true,
      submissionId: submission.id,
      teamId: team.id,
      teamCode: team.teamCode,
      roundNumber,
      score: dto.score,
      feedback: dto.feedback || null,
      updatedAt: submission.submittedAt,
    };
  }
}
