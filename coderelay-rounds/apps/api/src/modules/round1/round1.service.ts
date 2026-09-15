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
  Round1State,
  Round1StateTransitionDto,
  SaveAnswerDto,
  SubmitRound1Dto,
  Round1LeaderboardEntry,
} from '@coderelay/shared';
import { Role } from '@prisma/client';

@Injectable()
export class Round1Service {
  private readonly logger = new Logger(Round1Service.name);

  // Legal state transitions sequence & matrix
  private readonly allowedTransitions: Record<Round1State, Round1State[]> = {
    DRAFT: ['READY'],
    READY: ['DRAFT', 'LOBBY', 'COUNTDOWN'],
    LOBBY: ['COUNTDOWN', 'ACTIVE', 'READY'],
    COUNTDOWN: ['ACTIVE', 'LOBBY'],
    ACTIVE: ['SUBMISSION', 'LOCKED'],
    SUBMISSION: ['LOCKED'],
    LOCKED: ['SCORING'],
    SCORING: ['QUALIFICATION'],
    QUALIFICATION: ['COMPLETE'],
    COMPLETE: ['QUALIFICATION'], // Allow re-scoring/re-qualification adjustment by organizer
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly competitionGateway: CompetitionGateway,
  ) {}

  // 1. Get or initialize Round 1 record
  async getRound1Record() {
    let round = await this.prisma.round.findUnique({
      where: { roundNumber: 1 },
      include: {
        stages: true,
      },
    });

    if (!round) {
      round = await this.prisma.round.create({
        data: {
          roundNumber: 1,
          slug: 'code-iq',
          title: 'Round 1 — Code IQ',
          description: '20 MCQ / Predict-Output logic questions (20 mins)',
          status: 'DRAFT',
          durationSeconds: 1200,
          config: {
            round1State: 'DRAFT',
            qualificationRatio: 0.5,
            teamRepresentatives: {},
          },
        },
        include: {
          stages: true,
        },
      });
    }

    return round;
  }

  // 2. Authoritative Round 1 State Resolution
  async getRound1State() {
    const round = await this.getRound1Record();
    const config = (round.config as any) || {};
    const round1State: Round1State = config.round1State || 'DRAFT';
    const now = new Date();

    let startedAtISO: string | null = round.startedAt ? round.startedAt.toISOString() : null;
    let deadlineAtISO: string | null = config.deadlineAt || null;

    let remainingSeconds = 0;

    if (round1State === 'ACTIVE' && deadlineAtISO) {
      const deadline = new Date(deadlineAtISO);
      const diffMs = deadline.getTime() - now.getTime();
      remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
    } else if (round1State === 'ACTIVE' || round1State === 'COUNTDOWN') {
      remainingSeconds = round.durationSeconds;
    }

    return {
      roundId: round.id,
      state: round1State,
      startedAt: startedAtISO,
      deadlineAt: deadlineAtISO,
      durationSeconds: round.durationSeconds,
      remainingSeconds,
      qualificationRatio: config.qualificationRatio ?? 0.5,
      qualificationCount: config.qualificationCount ?? null,
      serverTimestamp: now.toISOString(),
    };
  }

  // 3. One Representative Per Team Enforcement & Locking (Database Unique Constraint Protected)
  async ensureTeamRepresentative(teamId: string, memberId: string): Promise<string> {
    const round = await this.getRound1Record();

    // 1. Check existing representative in DB table
    const existingRep = await this.prisma.roundRepresentative.findUnique({
      where: {
        roundId_teamId: {
          roundId: round.id,
          teamId,
        },
      },
    });

    if (existingRep) {
      if (existingRep.memberId !== memberId) {
        throw new ForbiddenException(
          'Round 1 allows only ONE representative per team. Another team member is already active in Round 1.',
        );
      }
      return existingRep.memberId;
    }

    // 2. Claim representative slot with DB unique constraint protection against race condition
    try {
      await this.prisma.roundRepresentative.create({
        data: {
          roundId: round.id,
          teamId,
          memberId,
        },
      });
      this.logger.log(`DB-locked member ${memberId} as representative for team ${teamId} in Round 1`);
      return memberId;
    } catch (error: any) {
      // Prisma P2002 is unique constraint violation (concurrent race condition)
      if (error?.code === 'P2002') {
        const rep = await this.prisma.roundRepresentative.findUnique({
          where: { roundId_teamId: { roundId: round.id, teamId } },
        });
        if (rep && rep.memberId !== memberId) {
          throw new ForbiddenException(
            'Round 1 allows only ONE representative per team. Another team member is already active in Round 1.',
          );
        }
        return memberId;
      }
      throw error;
    }
  }

  // 4. Get Participant Questions (Sanitized 20 Questions in Deterministic Order)
  async getParticipantQuestions(teamId: string, memberId: string) {
    await this.ensureTeamRepresentative(teamId, memberId);

    const round = await this.getRound1Record();
    const questions = await this.prisma.question.findMany({
      where: {
        roundId: round.id,
        status: { in: ['PUBLISHED', 'LOCKED'] },
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        options: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            label: true,
            content: true,
            displayOrder: true,
            // Explicitly EXCLUDE isCorrect
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
      displayOrder: q.displayOrder,
      options: q.options.map(({ id, label, content, displayOrder }) => ({
        id,
        label,
        content,
        displayOrder,
      })),
    }));
  }

  // 5. Answer Persistence (Draft Saving)
  async saveAnswer(teamId: string, memberId: string, dto: SaveAnswerDto) {
    await this.ensureTeamRepresentative(teamId, memberId);
    const roundState = await this.getRound1State();

    if (roundState.state !== 'ACTIVE') {
      throw new BadRequestException(`Cannot save answers when Round 1 is in state '${roundState.state}'`);
    }

    if (roundState.remainingSeconds <= 0 && roundState.deadlineAt) {
      throw new BadRequestException('Round 1 deadline has expired.');
    }

    // Check if team already submitted final submission
    const existingFinal = await this.prisma.submission.findFirst({
      where: {
        teamId,
        roundId: roundState.roundId,
        isFinal: true,
      },
    });

    if (existingFinal) {
      throw new ForbiddenException('Your final submission is already locked and immutable.');
    }

    const { questionId, selectedOptionId, selectedLabel, answerText } = dto;
    const finalAnswer = selectedOptionId || selectedLabel || answerText || '';

    // Find existing draft submission for this question
    const existingDraft = await this.prisma.submission.findFirst({
      where: {
        teamId,
        roundId: roundState.roundId,
        questionId,
      },
    });

    if (existingDraft) {
      return await this.prisma.submission.update({
        where: { id: existingDraft.id },
        data: {
          answerText: finalAnswer,
          memberId,
          submittedAt: new Date(),
        },
      });
    }

    return await this.prisma.submission.create({
      data: {
        teamId,
        roundId: roundState.roundId,
        questionId,
        memberId,
        answerText: finalAnswer,
        isFinal: false,
        submittedAt: new Date(),
      },
    });
  }

  // 6. Get Saved Answers & Participant Status
  async getSavedAnswers(teamId: string, memberId: string) {
    await this.ensureTeamRepresentative(teamId, memberId);
    const roundState = await this.getRound1State();

    const submissions = await this.prisma.submission.findMany({
      where: {
        teamId,
        roundId: roundState.roundId,
      },
    });

    const isSubmitted = submissions.some((s) => s.isFinal);
    const finalSub = submissions.find((s) => s.isFinal);

    const answersMap: Record<string, string> = {};
    submissions.forEach((s) => {
      if (s.questionId && s.answerText) {
        answersMap[s.questionId] = s.answerText;
      }
    });

    return {
      isSubmitted,
      submittedAt: finalSub ? finalSub.submittedAt.toISOString() : null,
      answers: answersMap,
      answeredQuestionIds: Object.keys(answersMap),
    };
  }

  // 7. Final Submission Processing (Idempotent & Immutable with Atomic Row Lock)
  async submitRound1(teamId: string, memberId: string, dto: SubmitRound1Dto) {
    await this.ensureTeamRepresentative(teamId, memberId);
    const roundState = await this.getRound1State();

    if (roundState.state !== 'ACTIVE' && roundState.state !== 'SUBMISSION') {
      throw new BadRequestException(`Cannot submit Round 1 while state is '${roundState.state}'`);
    }

    // Server-authoritative deadline check
    if (roundState.state === 'ACTIVE' && roundState.remainingSeconds <= 0) {
      throw new BadRequestException('Round 1 competition deadline has expired.');
    }

    const now = new Date();

    // Use Prisma transaction with atomic SELECT ... FOR UPDATE to lock the round row during submission validation
    return await this.prisma.$transaction(async (tx) => {
      // 1. Acquire PostgreSQL row-level lock on the Round record
      let currentConfig: any = {};
      try {
        const roundRows: any[] = await tx.$queryRaw`SELECT id, config FROM "rounds" WHERE id = ${roundState.roundId} FOR UPDATE`;
        if (roundRows && roundRows.length > 0) {
          currentConfig = typeof roundRows[0].config === 'string' ? JSON.parse(roundRows[0].config) : roundRows[0].config;
        } else {
          const r = await tx.round.findUnique({ where: { id: roundState.roundId } });
          currentConfig = (r?.config as any) || {};
        }
      } catch {
        // Fallback for mock/in-memory environments in unit tests
        const r = await tx.round.findUnique({ where: { id: roundState.roundId } });
        currentConfig = (r?.config as any) || {};
      }

      const currentState = currentConfig.round1State || 'DRAFT';

      if (currentState !== 'ACTIVE' && currentState !== 'SUBMISSION') {
        throw new BadRequestException(`Round closed or locked (current state: '${currentState}').`);
      }

      if (currentConfig.deadlineAt && new Date(currentConfig.deadlineAt) < now) {
        throw new BadRequestException('Round 1 competition deadline has expired.');
      }

      // 2. Double-check for existing final submission inside transaction (Atomic Idempotence)
      const existingFinal = await tx.submission.findFirst({
        where: {
          teamId,
          roundId: roundState.roundId,
          isFinal: true,
        },
      });

      if (existingFinal) {
        return {
          success: true,
          isSubmitted: true,
          submittedAt: existingFinal.submittedAt.toISOString(),
          message: 'Submission was already recorded and is immutable.',
        };
      }

      // 3. Update all draft submissions for this team & round to isFinal = true with exact atomic timestamp
      await tx.submission.updateMany({
        where: {
          teamId,
          roundId: roundState.roundId,
        },
        data: {
          isFinal: true,
          submittedAt: now,
        },
      });

      // 4. Guarantee at least one final submission record exists
      const count = await tx.submission.count({
        where: { teamId, roundId: roundState.roundId, isFinal: true },
      });

      if (count === 0) {
        await tx.submission.create({
          data: {
            teamId,
            roundId: roundState.roundId,
            memberId,
            isFinal: true,
            submittedAt: now,
          },
        });
      }

      // Broadcast WebSocket event
      this.competitionGateway.broadcastRound1Event('PARTICIPANT_SUBMITTED', {
        event: 'PARTICIPANT_SUBMITTED',
        roundId: roundState.roundId,
        teamId,
        submittedAt: now.toISOString(),
        timestamp: now.toISOString(),
      });

      return {
        success: true,
        isSubmitted: true,
        submittedAt: now.toISOString(),
        message: 'Round 1 submission received successfully and locked.',
      };
    });
  }

  // 8. Organizer State Transitions (Atomic Row Lock)
  async transitionState(actorId: string, actorUsername: string, dto: Round1StateTransitionDto) {
    const round = await this.getRound1Record();
    const targetState = dto.targetState;
    const now = new Date();

    return await this.prisma.$transaction(async (tx) => {
      let currentConfig: any = {};
      try {
        const roundRows: any[] = await tx.$queryRaw`SELECT id, config FROM "rounds" WHERE id = ${round.id} FOR UPDATE`;
        if (roundRows && roundRows.length > 0) {
          currentConfig = typeof roundRows[0].config === 'string' ? JSON.parse(roundRows[0].config) : roundRows[0].config;
        } else {
          currentConfig = (round.config as any) || {};
        }
      } catch {
        currentConfig = (round.config as any) || {};
      }

      const currentState: Round1State = currentConfig.round1State || 'DRAFT';
      const allowed = this.allowedTransitions[currentState] || [];
      if (!allowed.includes(targetState)) {
        throw new BadRequestException(
          `Invalid state transition from '${currentState}' to '${targetState}'. Allowed transitions: [${allowed.join(
            ', ',
          )}]`,
        );
      }

      currentConfig.round1State = targetState;

      if (dto.qualificationRatio !== undefined) {
        currentConfig.qualificationRatio = dto.qualificationRatio;
      }
      if (dto.qualificationCount !== undefined) {
        currentConfig.qualificationCount = dto.qualificationCount;
      }

      const updateData: any = { config: currentConfig };

      if (targetState === 'ACTIVE') {
        updateData.startedAt = now;
        const durationSec = round.durationSeconds || 1200;
        const deadline = new Date(now.getTime() + durationSec * 1000);
        currentConfig.deadlineAt = deadline.toISOString();
      } else if (targetState === 'LOCKED' || targetState === 'COMPLETE') {
        updateData.endedAt = now;
      }

      const updatedRound = await tx.round.update({
        where: { id: round.id },
        data: updateData,
      });

      // Audit logging
      await this.auditService.logAction({
        actorId,
        actorUsername,
        actorRole: Role.ORGANIZER,
        action: 'ROUND1_STATE_TRANSITION',
        resource: 'Round',
        resourceId: round.id,
        metadata: { from: currentState, to: targetState, config: currentConfig },
      });

      // Broadcast WebSocket event
      this.competitionGateway.broadcastRound1Event('ROUND_STATE_UPDATED', {
        event: 'ROUND_STATE_UPDATED',
        roundId: round.id,
        state: targetState,
        startedAt: updatedRound.startedAt ? updatedRound.startedAt.toISOString() : undefined,
        deadlineAt: currentConfig.deadlineAt,
        timestamp: now.toISOString(),
      });

      return {
        roundId: round.id,
        state: targetState,
        startedAt: updatedRound.startedAt ? updatedRound.startedAt.toISOString() : null,
        deadlineAt: currentConfig.deadlineAt || null,
        durationSeconds: round.durationSeconds,
        remainingSeconds: targetState === 'ACTIVE' ? round.durationSeconds : 0,
        qualificationRatio: currentConfig.qualificationRatio ?? 0.5,
        qualificationCount: currentConfig.qualificationCount ?? null,
        serverTimestamp: now.toISOString(),
      };
    });
  }

  // 9. Scoring Engine Execution
  async scoreRound1(actorId: string, actorUsername: string) {
    const roundState = await this.getRound1State();
    if (roundState.state !== 'LOCKED' && roundState.state !== 'SCORING') {
      throw new BadRequestException(`Scoring can only be run when round is in LOCKED or SCORING state. Current: '${roundState.state}'`);
    }

    const round = await this.getRound1Record();
    const questions = await this.prisma.question.findMany({
      where: { roundId: round.id },
      include: { options: true },
    });

    // Map correct options for each question
    const correctMap: Record<string, string[]> = {};
    const marksMap: Record<string, number> = {};

    questions.forEach((q) => {
      marksMap[q.id] = q.marks;
      correctMap[q.id] = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      // Also map labels A, B, C, D if present
      const correctLabels = q.options.filter((o) => o.isCorrect).map((o) => o.label);
      correctMap[q.id].push(...correctLabels);
    });

    // Fetch all submissions for Round 1
    const submissions = await this.prisma.submission.findMany({
      where: { roundId: round.id },
    });

    // Group submissions by team
    const teamSubmissionsMap: Record<string, typeof submissions> = {};
    submissions.forEach((sub) => {
      if (!teamSubmissionsMap[sub.teamId]) {
        teamSubmissionsMap[sub.teamId] = [];
      }
      teamSubmissionsMap[sub.teamId].push(sub);
    });

    // Score each team
    for (const [teamId, teamSubs] of Object.entries(teamSubmissionsMap)) {
      let teamTotalScore = 0;

      for (const sub of teamSubs) {
        if (sub.questionId && sub.answerText) {
          const validAnswers = correctMap[sub.questionId] || [];
          if (validAnswers.includes(sub.answerText)) {
            const marks = marksMap[sub.questionId] || 10;
            sub.score = marks;
            teamTotalScore += marks;
          } else {
            sub.score = 0;
          }

          await this.prisma.submission.update({
            where: { id: sub.id },
            data: { score: sub.score },
          });
        }
      }
    }

    // Auto-advance state to SCORING if in LOCKED
    if (roundState.state === 'LOCKED') {
      await this.transitionState(actorId, actorUsername, { targetState: 'SCORING' });
    }

    await this.auditService.logAction({
      actorId,
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'ROUND1_SCORING_COMPLETED',
      resource: 'Round',
      resourceId: round.id,
      metadata: { scoredTeamsCount: Object.keys(teamSubmissionsMap).length },
    });

    return { success: true, scoredTeamsCount: Object.keys(teamSubmissionsMap).length };
  }

  // 10. Leaderboard & Deterministic Tie-Break Ranking
  async getLeaderboard(): Promise<Round1LeaderboardEntry[]> {
    const round = await this.getRound1Record();
    const teams = await this.prisma.team.findMany({
      include: {
        members: true,
        submissions: {
          where: { roundId: round.id, isFinal: true },
        },
      },
    });

    const entries = teams.map((t) => {
      const finalSubs = t.submissions;
      let totalScore = 0;
      let earliestSubmittedAt: Date | null = null;

      finalSubs.forEach((s) => {
        totalScore += s.score || 0;
        if (s.submittedAt) {
          const subDate = new Date(s.submittedAt);
          if (!earliestSubmittedAt || subDate < earliestSubmittedAt) {
            earliestSubmittedAt = subDate;
          }
        }
      });

      const rep = t.members.find((m) => m.memberOrder === 1) || t.members[0];

      return {
        teamId: t.id,
        teamCode: t.teamCode,
        teamName: t.name,
        representativeName: rep ? rep.displayName : 'Representative',
        score: totalScore,
        submittedAt: earliestSubmittedAt ? (earliestSubmittedAt as Date).toISOString() : null,
        isQualified: t.isQualifiedR2,
        requiresReview: false,
      };
    });

    // Deterministic Sorting: Primary totalScore DESC, Secondary submittedAt ASC
    entries.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.submittedAt && b.submittedAt) {
        const timeA = new Date(a.submittedAt).getTime();
        const timeB = new Date(b.submittedAt).getTime();
        if (timeA !== timeB) {
          return timeA - timeB;
        }
      } else if (a.submittedAt && !b.submittedAt) {
        return -1;
      } else if (!a.submittedAt && b.submittedAt) {
        return 1;
      }

      // Mark exact score & exact millisecond timestamp ties for review
      a.requiresReview = true;
      b.requiresReview = true;
      return a.teamCode.localeCompare(b.teamCode);
    });

    return entries.map((e, index) => ({
      ...e,
      rank: index + 1,
    }));
  }

  // 11. Qualification Calculation
  async qualifyRound1(actorId: string, actorUsername: string) {
    const roundState = await this.getRound1State();
    if (roundState.state !== 'SCORING' && roundState.state !== 'QUALIFICATION') {
      throw new BadRequestException(`Qualification can only be run when round is in SCORING or QUALIFICATION state. Current: '${roundState.state}'`);
    }

    const leaderboard = await this.getLeaderboard();
    const totalTeams = leaderboard.length;

    let targetQualifyCount = 0;
    if (roundState.qualificationCount && roundState.qualificationCount > 0) {
      targetQualifyCount = roundState.qualificationCount;
    } else {
      const ratio = roundState.qualificationRatio ?? 0.5;
      targetQualifyCount = Math.ceil(totalTeams * ratio);
    }

    const qualifiedTeamIds = leaderboard.slice(0, targetQualifyCount).map((e) => e.teamId);
    const disqualifiedTeamIds = leaderboard.slice(targetQualifyCount).map((e) => e.teamId);

    await this.prisma.$transaction([
      this.prisma.team.updateMany({
        where: { id: { in: qualifiedTeamIds } },
        data: { isQualifiedR2: true },
      }),
      this.prisma.team.updateMany({
        where: { id: { in: disqualifiedTeamIds } },
        data: { isQualifiedR2: false },
      }),
    ]);

    if (roundState.state === 'SCORING') {
      await this.transitionState(actorId, actorUsername, { targetState: 'QUALIFICATION' });
    }

    await this.auditService.logAction({
      actorId,
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'ROUND1_QUALIFICATION_COMPLETED',
      resource: 'Round',
      resourceId: roundState.roundId,
      metadata: { totalTeams, qualifiedCount: qualifiedTeamIds.length },
    });

    this.competitionGateway.broadcastRound1Event('RESULTS_READY', {
      event: 'RESULTS_READY',
      roundId: roundState.roundId,
      qualifiedCount: qualifiedTeamIds.length,
      timestamp: new Date().toISOString(),
    });

    return {
      totalTeams,
      qualifiedCount: qualifiedTeamIds.length,
      disqualifiedCount: disqualifiedTeamIds.length,
    };
  }

  // 12. Organizer Emergency Lock (Atomic Row Lock)
  async emergencyLock(actorId: string, actorUsername: string) {
    const round = await this.getRound1Record();
    const now = new Date();

    return await this.prisma.$transaction(async (tx) => {
      let currentConfig: any = {};
      try {
        const roundRows: any[] = await tx.$queryRaw`SELECT id, config FROM "rounds" WHERE id = ${round.id} FOR UPDATE`;
        if (roundRows && roundRows.length > 0) {
          currentConfig = typeof roundRows[0].config === 'string' ? JSON.parse(roundRows[0].config) : roundRows[0].config;
        } else {
          currentConfig = (round.config as any) || {};
        }
      } catch {
        currentConfig = (round.config as any) || {};
      }

      currentConfig.round1State = 'LOCKED';

      await tx.round.update({
        where: { id: round.id },
        data: {
          config: currentConfig,
          endedAt: now,
        },
      });

      await this.auditService.logAction({
        actorId,
        actorUsername,
        actorRole: Role.ORGANIZER,
        action: 'ROUND1_EMERGENCY_LOCK',
        resource: 'Round',
        resourceId: round.id,
        metadata: { timestamp: now.toISOString() },
      });

      this.competitionGateway.broadcastRound1Event('ROUND_LOCKED', {
        event: 'ROUND_LOCKED',
        roundId: round.id,
        state: 'LOCKED',
        timestamp: now.toISOString(),
      });

      return { success: true, state: 'LOCKED', lockedAt: now.toISOString() };
    });
  }
}
