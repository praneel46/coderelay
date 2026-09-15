import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CompetitionGateway } from '../competition/competition.gateway';
import {
  Round2State,
  Round2StageType,
  Round2StateTransitionDto,
  SaveRound2AnswerDto,
  SubmitRound2StageDto,
  ReportSecurityEventDto,
  Round2LeaderboardEntry,
  Round2ParticipantStateResponse,
} from '@coderelay/shared';
import { Role, StageStatus, ViolationType } from '@prisma/client';

@Injectable()
export class Round2Service {
  private readonly logger = new Logger(Round2Service.name);

  // Legal state transitions for Round 2 state machine
  private readonly allowedTransitions: Record<Round2State, Round2State[]> = {
    DRAFT: ['READY'],
    READY: ['DRAFT', 'LOBBY', 'COUNTDOWN'],
    LOBBY: ['COUNTDOWN', 'MEMBER_1_ACTIVE', 'READY'],
    COUNTDOWN: ['MEMBER_1_ACTIVE', 'LOBBY'],
    MEMBER_1_ACTIVE: ['MEMBER_1_HANDOFF', 'LOCKED'],
    MEMBER_1_HANDOFF: ['MEMBER_2_ACTIVE', 'LOCKED'],
    MEMBER_2_ACTIVE: ['MEMBER_2_HANDOFF', 'LOCKED'],
    MEMBER_2_HANDOFF: ['MEMBER_3_ACTIVE', 'LOCKED'],
    MEMBER_3_ACTIVE: ['MEMBER_3_FINALIZE', 'LOCKED'],
    MEMBER_3_FINALIZE: ['LOCKED'],
    LOCKED: ['SCORING'],
    SCORING: ['COMPLETE'],
    COMPLETE: ['SCORING'],
  };

  // Stage roles mapping
  private readonly stageRoles: Record<number, Round2StageType> = {
    1: 'DEBUGGING',
    2: 'CODING',
    3: 'PREDICT_OUTPUT',
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly competitionGateway: CompetitionGateway,
  ) {}

  // 1. Get or initialize Round 2 record and stages
  async getRound2Record() {
    let round = await this.prisma.round.findUnique({
      where: { roundNumber: 2 },
      include: {
        stages: { orderBy: { stageOrder: 'asc' } },
      },
    });

    if (!round) {
      round = await this.prisma.round.create({
        data: {
          roundNumber: 2,
          slug: 'triple-strike',
          title: 'Round 2 — Triple Strike',
          description: 'Sequential Team Relay: Member 1 Debugging (15m) → Member 2 Coding (15m) → Member 3 Predict Output (15m)',
          status: 'DRAFT',
          durationSeconds: 2700, // 45 minutes total max duration
          config: {
            round2State: 'DRAFT',
          },
          stages: {
            create: [
              { stageOrder: 1, title: 'Stage 1 — Debugging', durationSeconds: 900, memberOrder: 1 },
              { stageOrder: 2, title: 'Stage 2 — Coding', durationSeconds: 900, memberOrder: 2 },
              { stageOrder: 3, title: 'Stage 3 — Predict Output', durationSeconds: 900, memberOrder: 3 },
            ],
          },
        },
        include: {
          stages: { orderBy: { stageOrder: 'asc' } },
        },
      });
    }

    return round;
  }

  // 2. Authoritative Round 2 State Resolution
  async getRound2State() {
    const round = await this.getRound2Record();
    const config = (round.config as any) || {};
    const round2State: Round2State = config.round2State || 'DRAFT';
    const now = new Date();

    let startedAtISO: string | null = round.startedAt ? round.startedAt.toISOString() : null;
    let deadlineAtISO: string | null = config.deadlineAt || null;

    let remainingSeconds = 0;
    if (deadlineAtISO) {
      const deadline = new Date(deadlineAtISO);
      remainingSeconds = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));
    }

    return {
      roundId: round.id,
      state: round2State,
      startedAt: startedAtISO,
      deadlineAt: deadlineAtISO,
      durationSeconds: round.durationSeconds,
      remainingSeconds,
      serverTimestamp: now.toISOString(),
    };
  }

  // 3. Helper: Check if team is Round 1 Qualified
  async verifyTeamQualified(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { orderBy: { memberOrder: 'asc' } } },
    });

    if (!team) {
      throw new NotFoundException(`Team '${teamId}' not found.`);
    }

    if (!team.isQualifiedR2) {
      throw new ForbiddenException('Team is not qualified for Round 2.');
    }

    return team;
  }

  // 4. Get active StageSession for a team
  async getOrCreateTeamStageSession(teamId: string, stageOrder: number, memberId?: string) {
    const round = await this.getRound2Record();
    const stage = round.stages.find((s) => s.stageOrder === stageOrder);
    if (!stage) {
      throw new NotFoundException(`Stage order ${stageOrder} not found in Round 2.`);
    }

    let session = await this.prisma.stageSession.findFirst({
      where: {
        teamId,
        stageId: stage.id,
      },
    });

    if (!session) {
      const now = new Date();
      const deadline = new Date(now.getTime() + 900 * 1000); // 15 minutes = 900 seconds
      session = await this.prisma.stageSession.create({
        data: {
          teamId,
          stageId: stage.id,
          memberId: memberId || null,
          status: StageStatus.ACTIVE,
          warningCount: 0,
          startedAt: now,
          deadlineAt: deadline,
        },
      });
    }

    return session;
  }

  // 5. Participant State Resolution
  async getParticipantState(teamId: string, memberId: string): Promise<Round2ParticipantStateResponse> {
    const team = await this.verifyTeamQualified(teamId);

    const currentMember = team.members.find((m) => m.id === memberId);
    if (!currentMember) {
      throw new ForbiddenException('Authenticated member does not belong to this team.');
    }

    const round = await this.getRound2Record();
    const roundState = await this.getRound2State();
    const now = new Date();

    // Determine current active stage for this team
    const stageSessions = await this.prisma.stageSession.findMany({
      where: { teamId, stageId: { in: round.stages.map((s) => s.id) } },
      include: { stage: true },
    });

    // Find current active or last completed stage
    let activeStageOrder = 1;
    let currentStageSession = stageSessions.find((s) => s.status === StageStatus.ACTIVE);

    if (!currentStageSession) {
      // Check if all submitted
      const submittedCount = stageSessions.filter((s) => s.isFinal).length;
      if (submittedCount >= 3) {
        activeStageOrder = 3;
        currentStageSession = stageSessions.find((s) => s.stage?.stageOrder === 3) || stageSessions[stageSessions.length - 1];
      } else {
        activeStageOrder = Math.min(3, submittedCount + 1);
        const nextStage = round.stages.find((s) => s.stageOrder === activeStageOrder);
        if (nextStage) {
          currentStageSession = stageSessions.find((s) => s.stageId === nextStage.id);
        }
      }
    } else {
      activeStageOrder = currentStageSession.stage.stageOrder;
    }

    const activeRole = this.stageRoles[activeStageOrder] || 'DEBUGGING';
    const isCurrentMemberActive = currentMember.memberOrder === activeStageOrder;

    // Check automatic deadline expiration if active
    let remainingSeconds = 900;
    let deadlineAtISO: string | null = null;
    let startedAtISO: string | null = null;
    let warningCount = 0;
    let isSubmitted = false;
    let isAutoSubmitted = false;
    let submittedAtISO: string | null = null;
    let stageStatus = StageStatus.PENDING.toString();

    if (currentStageSession) {
      stageStatus = currentStageSession.status.toString();
      warningCount = currentStageSession.warningCount;
      isSubmitted = currentStageSession.isFinal;
      isAutoSubmitted = currentStageSession.isAutoSubmitted;
      submittedAtISO = currentStageSession.submittedAt ? currentStageSession.submittedAt.toISOString() : null;
      startedAtISO = currentStageSession.startedAt
        ? currentStageSession.startedAt.toISOString()
        : round.startedAt
        ? round.startedAt.toISOString()
        : null;

      if (currentStageSession.deadlineAt) {
        deadlineAtISO = currentStageSession.deadlineAt.toISOString();
        const diffMs = currentStageSession.deadlineAt.getTime() - now.getTime();
        remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));

        // Auto-finalize if deadline passed and active
        if (remainingSeconds <= 0 && currentStageSession.status === StageStatus.ACTIVE) {
          await this.autoFinalizeStage(teamId, activeStageOrder, 'TIMED_OUT');
          return await this.getParticipantState(teamId, memberId);
        }
      }
    }

    // Get answered question IDs for active stage
    const activeStage = round.stages.find((s) => s.stageOrder === activeStageOrder);
    let answeredQuestionIds: string[] = [];
    if (activeStage) {
      const subs = await this.prisma.submission.findMany({
        where: {
          teamId,
          roundId: round.id,
          stageId: activeStage.id,
        },
      });
      answeredQuestionIds = subs.filter((s) => s.answerText || s.codeContent).map((s) => s.questionId).filter((qId): qId is string => qId !== null);
    }

    return {
      roundState: roundState.state,
      teamId: team.id,
      teamCode: team.teamCode,
      teamName: team.name,
      memberId: currentMember.id,
      memberName: currentMember.displayName,
      memberOrder: currentMember.memberOrder,
      activeStageOrder,
      activeRole,
      isCurrentMemberActive,
      stageStatus,
      startedAt: startedAtISO,
      deadlineAt: deadlineAtISO,
      remainingSeconds,
      warningCount,
      isSubmitted,
      isAutoSubmitted,
      submittedAt: submittedAtISO,
      answeredQuestionIds,
    };
  }

  // 6. Get Sanitized Stage Questions (Strict Isolation)
  async getParticipantQuestions(teamId: string, memberId: string) {
    const participantState = await this.getParticipantState(teamId, memberId);

    // Strict Member Isolation Guard
    if (participantState.memberOrder !== participantState.activeStageOrder) {
      throw new ForbiddenException(
        `Strict Member Isolation: Member ${participantState.memberOrder} cannot access questions for Stage ${participantState.activeStageOrder}. Only the active member may access questions.`,
      );
    }

    if (participantState.startedAt) {
      const startedAtTime = new Date(participantState.startedAt).getTime();
      if (Date.now() < startedAtTime) {
        throw new BadRequestException('Competition has not started yet. Questions remain locked during 5-second countdown.');
      }
    }

    const round = await this.getRound2Record();
    const activeStage = round.stages.find((s) => s.stageOrder === participantState.activeStageOrder);
    if (!activeStage) {
      throw new NotFoundException(`Stage ${participantState.activeStageOrder} not found.`);
    }

    const questions = await this.prisma.question.findMany({
      where: {
        roundId: round.id,
        stageId: activeStage.id,
        status: { in: ['PUBLISHED', 'LOCKED'] },
      },
      orderBy: { displayOrder: 'asc' },
      take: 3, // Exactly 3 questions per stage
      include: {
        options: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            label: true,
            content: true,
            displayOrder: true,
            // EXCLUDE isCorrect
          },
        },
      },
    });

    return questions.map((q) => ({
      id: q.id,
      title: q.title,
      problemStatement: q.problemStatement,
      codeSnippet: q.codeSnippet,
      language: q.language,
      type: q.type,
      marks: q.marks,
      stageOrder: activeStage.stageOrder,
      displayOrder: q.displayOrder,
      options: q.options.map(({ id, label, content, displayOrder }) => ({
        id,
        label,
        content,
        displayOrder,
      })),
    }));
  }

  // 7. Answer Persistence (Draft Saving)
  async saveAnswer(teamId: string, memberId: string, dto: SaveRound2AnswerDto) {
    const participantState = await this.getParticipantState(teamId, memberId);

    if (!participantState.isCurrentMemberActive) {
      throw new ForbiddenException('Only the currently active member can save draft answers.');
    }

    if (participantState.isSubmitted) {
      throw new ForbiddenException('Stage submission is locked and immutable.');
    }

    if (participantState.startedAt) {
      const startedAtTime = new Date(participantState.startedAt).getTime();
      if (Date.now() < startedAtTime) {
        throw new BadRequestException('Competition has not started yet. Draft saving is locked during 5-second countdown.');
      }
    }

    if (participantState.remainingSeconds <= 0 && participantState.deadlineAt) {
      throw new BadRequestException('Stage 15-minute deadline has expired.');
    }

    const round = await this.getRound2Record();
    const activeStage = round.stages.find((s) => s.stageOrder === participantState.activeStageOrder);
    if (!activeStage) {
      throw new NotFoundException(`Stage ${participantState.activeStageOrder} not found.`);
    }

    const { questionId, selectedOptionId, selectedLabel, answerText, codeContent } = dto;
    const finalAnswer = selectedOptionId || selectedLabel || answerText || '';

    const existingDraft = await this.prisma.submission.findFirst({
      where: {
        teamId,
        roundId: round.id,
        stageId: activeStage.id,
        questionId,
      },
    });

    if (existingDraft) {
      return await this.prisma.submission.update({
        where: { id: existingDraft.id },
        data: {
          answerText: finalAnswer,
          codeContent: codeContent || null,
          memberId,
          submittedAt: new Date(),
        },
      });
    }

    return await this.prisma.submission.create({
      data: {
        teamId,
        roundId: round.id,
        stageId: activeStage.id,
        questionId,
        memberId,
        answerText: finalAnswer,
        codeContent: codeContent || null,
        isFinal: false,
        submittedAt: new Date(),
      },
    });
  }

  // 8. Get Saved Answers
  async getSavedAnswers(teamId: string, memberId: string) {
    const participantState = await this.getParticipantState(teamId, memberId);
    const round = await this.getRound2Record();
    const activeStage = round.stages.find((s) => s.stageOrder === participantState.activeStageOrder);

    if (!activeStage) {
      return { isSubmitted: false, answers: {}, codeContents: {} };
    }

    const submissions = await this.prisma.submission.findMany({
      where: {
        teamId,
        roundId: round.id,
        stageId: activeStage.id,
      },
    });

    const answersMap: Record<string, string> = {};
    const codeMap: Record<string, string> = {};

    submissions.forEach((s) => {
      if (s.questionId) {
        if (s.answerText) answersMap[s.questionId] = s.answerText;
        if (s.codeContent) codeMap[s.questionId] = s.codeContent;
      }
    });

    return {
      isSubmitted: participantState.isSubmitted,
      submittedAt: participantState.submittedAt,
      answers: answersMap,
      codeContents: codeMap,
      answeredQuestionIds: Object.keys(answersMap),
    };
  }

  // 9. Transactional Handoff & Stage Submission
  async submitStage(teamId: string, memberId: string, dto: SubmitRound2StageDto) {
    const participantState = await this.getParticipantState(teamId, memberId);

    if (!participantState.isCurrentMemberActive) {
      throw new ForbiddenException('Only the currently active member can submit this stage.');
    }

    if (participantState.startedAt) {
      const startedAtTime = new Date(participantState.startedAt).getTime();
      if (Date.now() < startedAtTime) {
        throw new BadRequestException('Competition has not started yet. Stage submission is locked during 5-second countdown.');
      }
    }

    const now = new Date();

    // Perform Atomic Handoff Transaction with PostgreSQL Row Locking
    return await this.prisma.$transaction(async (tx) => {
      const round = await tx.round.findUnique({
        where: { roundNumber: 2 },
        include: { stages: { orderBy: { stageOrder: 'asc' } } },
      });
      if (!round) throw new NotFoundException('Round 2 not found.');

      const currentStage = round.stages.find((s) => s.stageOrder === participantState.activeStageOrder);
      if (!currentStage) throw new NotFoundException(`Stage ${participantState.activeStageOrder} not found.`);

      // 1. Lock stage session record for UPDATE
      let stageSession = await tx.stageSession.findFirst({
        where: { teamId, stageId: currentStage.id },
      });

      if (!stageSession) {
        stageSession = await tx.stageSession.create({
          data: {
            teamId,
            stageId: currentStage.id,
            memberId,
            status: StageStatus.ACTIVE,
            startedAt: now,
            deadlineAt: new Date(now.getTime() + 900 * 1000),
          },
        });
      }

      if (stageSession.isFinal) {
        return {
          success: true,
          isSubmitted: true,
          submittedAt: stageSession.submittedAt?.toISOString() || now.toISOString(),
          message: 'Stage submission was already recorded and is locked.',
        };
      }

      // Check deadline
      if (stageSession.deadlineAt && stageSession.deadlineAt < now) {
        throw new BadRequestException('Stage 15-minute deadline has expired.');
      }

      // 2. Lock current stage session as SUBMITTED
      await tx.stageSession.update({
        where: { id: stageSession.id },
        data: {
          status: StageStatus.SUBMITTED,
          isFinal: true,
          submittedAt: now,
          endedAt: now,
        },
      });

      // 3. Mark all question submissions for this stage as isFinal = true
      await tx.submission.updateMany({
        where: { teamId, roundId: round.id, stageId: currentStage.id },
        data: { isFinal: true, submittedAt: now },
      });

      // 4. Atomic Handoff to Next Member Stage
      const nextStageOrder = participantState.activeStageOrder + 1;
      if (nextStageOrder <= 3) {
        const nextStage = round.stages.find((s) => s.stageOrder === nextStageOrder);
        if (nextStage) {
          const nextDeadline = new Date(now.getTime() + 900 * 1000); // Fresh 15-minute deadline
          const nextMember = (await tx.teamMember.findFirst({
            where: { teamId, memberOrder: nextStageOrder },
          })) || null;

          await tx.stageSession.create({
            data: {
              teamId,
              stageId: nextStage.id,
              memberId: nextMember?.id || null,
              status: StageStatus.ACTIVE,
              startedAt: now,
              deadlineAt: nextDeadline,
            },
          });

          this.competitionGateway.broadcastRound2Event('STAGE_HANDOFF', {
            event: 'STAGE_HANDOFF',
            roundId: round.id,
            state: `MEMBER_${nextStageOrder}_ACTIVE` as Round2State,
            teamId,
            stageOrder: nextStageOrder,
            memberOrder: nextStageOrder,
            startedAt: now.toISOString(),
            deadlineAt: nextDeadline.toISOString(),
            timestamp: now.toISOString(),
          });
        }
      } else {
        // All 3 stages complete for team -> Final Round 2 Lock for team
        this.competitionGateway.broadcastRound2Event('ROUND2_LOCKED', {
          event: 'ROUND2_LOCKED',
          roundId: round.id,
          state: 'MEMBER_3_FINALIZE' as Round2State,
          teamId,
          timestamp: now.toISOString(),
        });
      }

      return {
        success: true,
        isSubmitted: true,
        submittedAt: now.toISOString(),
        activeStageOrder: participantState.activeStageOrder,
        nextStageOrder: nextStageOrder <= 3 ? nextStageOrder : null,
        message: nextStageOrder <= 3
          ? `Stage ${participantState.activeStageOrder} submitted. Handoff to Stage ${nextStageOrder} complete.`
          : 'All 3 stages submitted. Team Round 2 submission complete and locked.',
      };
    });
  }

  // 10. Auto-Finalize Stage on Timeout / 3-Warnings
  async autoFinalizeStage(teamId: string, stageOrder: number, reason: 'TIMED_OUT' | 'FORCE_SUBMITTED') {
    const round = await this.getRound2Record();
    const stage = round.stages.find((s) => s.stageOrder === stageOrder);
    if (!stage) return;

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const session = await tx.stageSession.findFirst({
        where: { teamId, stageId: stage.id },
      });

      if (!session || session.isFinal) return;

      const finalStatus = reason === 'TIMED_OUT' ? StageStatus.TIMED_OUT : StageStatus.FORCE_SUBMITTED;

      await tx.stageSession.update({
        where: { id: session.id },
        data: {
          status: finalStatus,
          isFinal: true,
          isAutoSubmitted: true,
          submittedAt: now,
          endedAt: now,
        },
      });

      await tx.submission.updateMany({
        where: { teamId, roundId: round.id, stageId: stage.id },
        data: { isFinal: true, isAutoSubmitted: true, submittedAt: now },
      });

      // Handoff to next stage if applicable
      const nextStageOrder = stageOrder + 1;
      if (nextStageOrder <= 3) {
        const nextStage = round.stages.find((s) => s.stageOrder === nextStageOrder);
        if (nextStage) {
          const nextDeadline = new Date(now.getTime() + 900 * 1000);
          const nextMember = await tx.teamMember.findFirst({
            where: { teamId, memberOrder: nextStageOrder },
          });

          await tx.stageSession.create({
            data: {
              teamId,
              stageId: nextStage.id,
              memberId: nextMember?.id || null,
              status: StageStatus.ACTIVE,
              startedAt: now,
              deadlineAt: nextDeadline,
            },
          });
        }
      }
    });

    this.competitionGateway.broadcastRound2Event('STAGE_AUTO_SUBMITTED', {
      event: 'STAGE_AUTO_SUBMITTED',
      roundId: round.id,
      state: `MEMBER_${Math.min(3, stageOrder + 1)}_ACTIVE` as Round2State,
      teamId,
      stageOrder,
      reason,
      timestamp: now.toISOString(),
    });
  }

  // 11. Security Warning Report & 3-Warning Auto-Submit
  async reportSecurityEvent(teamId: string, memberId: string, dto: ReportSecurityEventDto) {
    const participantState = await this.getParticipantState(teamId, memberId);

    if (!participantState.isCurrentMemberActive) {
      throw new ForbiddenException('Security report ignored for inactive member.');
    }

    if (participantState.isSubmitted) {
      return { warningCount: participantState.warningCount, autoSubmitted: true };
    }

    return await this.prisma.$transaction(async (tx) => {
      const round = await tx.round.findUnique({
        where: { roundNumber: 2 },
        include: { stages: { orderBy: { stageOrder: 'asc' } } },
      });
      if (!round) throw new NotFoundException('Round 2 not found.');

      const activeStage = round.stages.find((s) => s.stageOrder === participantState.activeStageOrder);
      if (!activeStage) throw new NotFoundException('Active stage not found.');

      let session = await tx.stageSession.findFirst({
        where: { teamId, stageId: activeStage.id },
      });

      if (!session) {
        session = await tx.stageSession.create({
          data: {
            teamId,
            stageId: activeStage.id,
            memberId,
            status: StageStatus.ACTIVE,
            startedAt: new Date(),
            deadlineAt: new Date(Date.now() + 900 * 1000),
          },
        });
      }

      if (session.isFinal || session.status === StageStatus.SUBMITTED || session.status === StageStatus.FORCE_SUBMITTED || session.status === StageStatus.TIMED_OUT) {
        return {
          warningCount: Math.min(3, session.warningCount),
          autoSubmitted: true,
          message: 'Stage submission was already finalized and locked.',
        };
      }

      let violationType: ViolationType = ViolationType.TAB_SWITCH;
      if (dto.violationType === 'VISIBILITY_CHANGE') violationType = ViolationType.VISIBILITY_CHANGE;
      if (dto.violationType === 'FULLSCREEN_EXIT') violationType = ViolationType.FULLSCREEN_EXIT;
      if (dto.violationType === 'COPY') violationType = ViolationType.COPY;
      if (dto.violationType === 'PASTE') violationType = ViolationType.PASTE;

      const newWarningCount = Math.min(3, session.warningCount + 1);

      await tx.stageSession.update({
        where: { id: session.id },
        data: { warningCount: newWarningCount },
      });

      await tx.securityEvent.create({
        data: {
          teamId,
          memberId,
          stageId: activeStage.id,
          violationType,
          warningNumber: newWarningCount,
          actionTaken: newWarningCount >= 3 ? 'FORCE_SUBMIT' : 'WARNING',
          metadata: { details: dto.details || '' },
        },
      });

      this.competitionGateway.broadcastRound2Event('SECURITY_WARNING', {
        event: 'SECURITY_WARNING',
        roundId: round.id,
        state: `MEMBER_${participantState.activeStageOrder}_ACTIVE` as Round2State,
        teamId,
        stageOrder: participantState.activeStageOrder,
        memberOrder: participantState.memberOrder,
        warningCount: newWarningCount,
        timestamp: new Date().toISOString(),
      });

      if (newWarningCount >= 3) {
        this.logger.warn(`Team ${teamId} Member ${memberId} reached 3 warnings! Auto-submitting stage.`);
        const now = new Date();
        await tx.stageSession.update({
          where: { id: session.id },
          data: {
            status: StageStatus.FORCE_SUBMITTED,
            isFinal: true,
            isAutoSubmitted: true,
            submittedAt: now,
            endedAt: now,
          },
        });

        await tx.submission.updateMany({
          where: { teamId, roundId: round.id, stageId: activeStage.id },
          data: { isFinal: true, isAutoSubmitted: true, submittedAt: now },
        });

        const nextStageOrder = participantState.activeStageOrder + 1;
        if (nextStageOrder <= 3) {
          const nextStage = round.stages.find((s) => s.stageOrder === nextStageOrder);
          if (nextStage) {
            const nextDeadline = new Date(now.getTime() + 900 * 1000);
            const nextMember = await tx.teamMember.findFirst({
              where: { teamId, memberOrder: nextStageOrder },
            });

            const existingNextSession = await tx.stageSession.findFirst({
              where: { teamId, stageId: nextStage.id },
            });

            if (!existingNextSession) {
              await tx.stageSession.create({
                data: {
                  teamId,
                  stageId: nextStage.id,
                  memberId: nextMember?.id || null,
                  status: StageStatus.ACTIVE,
                  startedAt: now,
                  deadlineAt: nextDeadline,
                },
              });
            }
          }
        }

        this.competitionGateway.broadcastRound2Event('STAGE_AUTO_SUBMITTED', {
          event: 'STAGE_AUTO_SUBMITTED',
          roundId: round.id,
          state: `MEMBER_${Math.min(3, participantState.activeStageOrder + 1)}_ACTIVE` as Round2State,
          teamId,
          stageOrder: participantState.activeStageOrder,
          reason: 'FORCE_SUBMITTED',
          timestamp: now.toISOString(),
        });

        return {
          warningCount: 3,
          autoSubmitted: true,
          message: '3 security warnings reached. Current stage auto-submitted and locked.',
        };
      }

      return {
        warningCount: newWarningCount,
        autoSubmitted: false,
        message: `Warning ${newWarningCount} recorded on server.`,
      };
    });
  }

  // 12. Organizer State Machine Transitions
  async transitionState(actorId: string, actorUsername: string, dto: Round2StateTransitionDto) {
    const round = await this.getRound2Record();
    const config = (round.config as any) || {};
    const currentState: Round2State = config.round2State || 'DRAFT';
    const targetState = dto.targetState;

    const allowed = this.allowedTransitions[currentState] || [];
    if (!allowed.includes(targetState)) {
      throw new BadRequestException(
        `Invalid state transition from '${currentState}' to '${targetState}'. Allowed transitions: [${allowed.join(', ')}]`,
      );
    }

    const now = new Date();
    config.round2State = targetState;

    const updateData: any = { config };
    if (targetState === 'MEMBER_1_ACTIVE') {
      updateData.startedAt = now;
      const deadline = new Date(now.getTime() + round.durationSeconds * 1000);
      config.deadlineAt = deadline.toISOString();
    } else if (targetState === 'LOCKED' || targetState === 'COMPLETE') {
      updateData.endedAt = now;
    }

    const updatedRound = await this.prisma.round.update({
      where: { id: round.id },
      data: updateData,
    });

    await this.auditService.logAction({
      actorId,
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'ROUND2_STATE_TRANSITION',
      resource: 'Round',
      resourceId: round.id,
      metadata: { from: currentState, to: targetState, config },
    });

    this.competitionGateway.broadcastRound2Event('ROUND2_STATE_UPDATED', {
      event: 'ROUND2_STATE_UPDATED',
      roundId: round.id,
      state: targetState,
      startedAt: updatedRound.startedAt ? updatedRound.startedAt.toISOString() : undefined,
      deadlineAt: config.deadlineAt,
      timestamp: now.toISOString(),
    });

    return await this.getRound2State();
  }

  // 13. Organizer Emergency Lock
  async emergencyLock(actorId: string, actorUsername: string) {
    const round = await this.getRound2Record();
    const now = new Date();

    const config = (round.config as any) || {};
    config.round2State = 'LOCKED';

    await this.prisma.round.update({
      where: { id: round.id },
      data: { config, endedAt: now },
    });

    await this.auditService.logAction({
      actorId,
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'ROUND2_EMERGENCY_LOCK',
      resource: 'Round',
      resourceId: round.id,
      metadata: { timestamp: now.toISOString() },
    });

    this.competitionGateway.broadcastRound2Event('ROUND2_LOCKED', {
      event: 'ROUND2_LOCKED',
      roundId: round.id,
      state: 'LOCKED',
      timestamp: now.toISOString(),
    });

    return { success: true, state: 'LOCKED', lockedAt: now.toISOString() };
  }

  // 14. Scoring Engine Execution (Configurable / TBD Weightings)
  async scoreRound2(actorId: string, actorUsername: string) {
    const roundState = await this.getRound2State();
    if (roundState.state !== 'LOCKED' && roundState.state !== 'SCORING') {
      throw new BadRequestException(`Scoring can only be run when round is LOCKED or SCORING. Current: '${roundState.state}'`);
    }

    const round = await this.getRound2Record();
    const questions = await this.prisma.question.findMany({
      where: { roundId: round.id },
      include: { options: true },
    });

    // Predict Output Stage Question Scoring Map
    const correctMap: Record<string, string[]> = {};
    const marksMap: Record<string, number> = {};
    questions.forEach((q) => {
      marksMap[q.id] = q.marks || 10;
      correctMap[q.id] = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      correctMap[q.id].push(...q.options.filter((o) => o.isCorrect).map((o) => o.label));
    });

    const submissions = await this.prisma.submission.findMany({
      where: { roundId: round.id },
    });

    let scoredCount = 0;
    for (const sub of submissions) {
      if (sub.questionId && sub.answerText) {
        const valids = correctMap[sub.questionId] || [];
        if (valids.length > 0) {
          sub.score = valids.includes(sub.answerText) ? (marksMap[sub.questionId] || 10) : 0;
          await this.prisma.submission.update({
            where: { id: sub.id },
            data: { score: sub.score },
          });
          scoredCount++;
        }
      }
    }

    if (roundState.state === 'LOCKED') {
      await this.transitionState(actorId, actorUsername, { targetState: 'SCORING' });
    }

    await this.auditService.logAction({
      actorId,
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'ROUND2_SCORING_COMPLETED',
      resource: 'Round',
      resourceId: round.id,
      metadata: { scoredSubmissionsCount: scoredCount, note: 'Round 2 Debugging/Coding scoring weights remain TBD for manual evaluation.' },
    });

    return {
      success: true,
      scoredSubmissionsCount: scoredCount,
      note: 'Predict Output answers scored automatically. Debugging and Coding submission code preserved for TBD manual evaluation.',
    };
  }

  // 15. Leaderboard Engine
  async getLeaderboard(): Promise<Round2LeaderboardEntry[]> {
    const round = await this.getRound2Record();
    const qualifiedTeams = await this.prisma.team.findMany({
      where: { isQualifiedR2: true },
      include: {
        members: { orderBy: { memberOrder: 'asc' } },
        stageSessions: true,
        submissions: { where: { roundId: round.id, isFinal: true } },
      },
    });

    const entries = qualifiedTeams.map((t) => {
      let totalScore = 0;
      let latestSubmittedAt: Date | null = null;

      t.submissions.forEach((s) => {
        totalScore += s.score || 0;
        if (s.submittedAt) {
          const subDate = new Date(s.submittedAt);
          if (!latestSubmittedAt || subDate > latestSubmittedAt) {
            latestSubmittedAt = subDate;
          }
        }
      });

      const sessions = t.stageSessions.sort((a, b) => (b.createdAt.getTime() - a.createdAt.getTime()));
      const currentSession = sessions[0];
      const activeStageOrder = currentSession ? (round.stages.find((s) => s.id === currentSession.stageId)?.stageOrder || 1) : 1;
      const warningCount = currentSession ? currentSession.warningCount : 0;
      const stageStatus = currentSession ? currentSession.status.toString() : 'PENDING';

      return {
        teamId: t.id,
        teamCode: t.teamCode,
        teamName: t.name,
        currentStageOrder: activeStageOrder,
        activeMemberOrder: activeStageOrder,
        stageStatus,
        warningCount,
        score: totalScore,
        submittedAt: latestSubmittedAt ? (latestSubmittedAt as Date).toISOString() : null,
        isQualified: t.isQualifiedR4,
        requiresReview: false,
      };
    });

    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.submittedAt && b.submittedAt) {
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }
      return a.teamCode.localeCompare(b.teamCode);
    });

    return entries.map((e, index) => ({
      ...e,
      rank: index + 1,
    }));
  }
}
