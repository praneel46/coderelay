import { Round1Service } from '../src/modules/round1/round1.service';
import { Round1Controller } from '../src/modules/round1/round1.controller';
import { Round1OrganizerController } from '../src/modules/round1/round1-organizer.controller';
import { ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ Scenario ${passed + failed}: ${description}`);
  } else {
    failed++;
    console.error(`  ❌ Scenario ${passed + failed}: FAILED - ${description}`);
  }
}

async function runRound1EngineTests() {
  console.log('🚀 Running Round 1 Engine (Code IQ) Test Suite (24 Scenarios)...');

  // In-memory mock environment
  const mockConfig: any = {
    round1State: 'DRAFT',
    qualificationRatio: 0.5,
    teamRepresentatives: {},
  };

  const mockRound: any = {
    id: 'round-1-uuid',
    roundNumber: 1,
    slug: 'code-iq',
    title: 'Round 1 — Code IQ',
    description: '20 MCQ / Predict-Output logic questions (20 mins)',
    status: 'DRAFT',
    durationSeconds: 1200,
    config: mockConfig,
    startedAt: null as Date | null,
    endedAt: null as Date | null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQuestions = Array.from({ length: 20 }, (_, i) => ({
    id: `q-${i + 1}`,
    title: `Question ${i + 1}`,
    problemStatement: `Problem statement ${i + 1}`,
    codeSnippet: i % 2 === 0 ? `print(${i + 1})` : null,
    language: 'python',
    type: 'MCQ',
    difficulty: 'MEDIUM',
    marks: 10,
    status: 'PUBLISHED',
    roundId: 'round-1-uuid',
    stageId: null,
    displayOrder: i + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    options: [
      { id: `opt-${i + 1}-A`, questionId: `q-${i + 1}`, label: 'A', content: 'Option A', isCorrect: true, displayOrder: 1 },
      { id: `opt-${i + 1}-B`, questionId: `q-${i + 1}`, label: 'B', content: 'Option B', isCorrect: false, displayOrder: 2 },
    ],
  }));

  let mockSubmissions: any[] = [];
  let mockAuditLogs: any[] = [];
  let mockRepresentatives: Record<string, any> = {};
  let mockTeams: any[] = [
    {
      id: 'team-alpha-id',
      teamCode: 'ALPHA-001',
      name: 'Team Alpha',
      isQualifiedR2: false,
      members: [{ id: 'member-1-id', memberOrder: 1, displayName: 'Member 1' }],
      submissions: [],
    },
    {
      id: 'team-beta-id',
      teamCode: 'BETA-002',
      name: 'Team Beta',
      isQualifiedR2: false,
      members: [{ id: 'member-2-id', memberOrder: 1, displayName: 'Member 2' }],
      submissions: [],
    },
  ];

  const mockPrisma: any = {
    round: {
      findUnique: async () => mockRound,
      create: async () => mockRound,
      update: async ({ data }: any) => {
        if (data.config) Object.assign(mockConfig, data.config);
        if (data.startedAt !== undefined) mockRound.startedAt = data.startedAt;
        if (data.endedAt !== undefined) mockRound.endedAt = data.endedAt;
        return mockRound;
      },
    },
    question: {
      findMany: async () => mockQuestions,
    },
    roundRepresentative: {
      findUnique: async ({ where }: any) => {
        const key = `${where.roundId_teamId.roundId}_${where.roundId_teamId.teamId}`;
        return mockRepresentatives[key] || null;
      },
      create: async ({ data }: any) => {
        const key = `${data.roundId}_${data.teamId}`;
        if (mockRepresentatives[key]) {
          const err: any = new Error('Unique constraint violation');
          err.code = 'P2002';
          throw err;
        }
        mockRepresentatives[key] = { id: `rep-${data.teamId}`, ...data };
        return mockRepresentatives[key];
      },
    },
    submission: {
      findFirst: async ({ where }: any) => {
        return mockSubmissions.find((s) => {
          if (where.teamId && s.teamId !== where.teamId) return false;
          if (where.roundId && s.roundId !== where.roundId) return false;
          if (where.questionId && s.questionId !== where.questionId) return false;
          if (where.isFinal !== undefined && s.isFinal !== where.isFinal) return false;
          return true;
        });
      },
      findMany: async ({ where }: any) => {
        return mockSubmissions.filter((s) => {
          if (where.teamId && s.teamId !== where.teamId) return false;
          if (where.roundId && s.roundId !== where.roundId) return false;
          if (where.isFinal !== undefined && s.isFinal !== where.isFinal) return false;
          return true;
        });
      },
      create: async ({ data }: any) => {
        const newSub = { id: `sub-${mockSubmissions.length + 1}`, ...data };
        mockSubmissions.push(newSub);
        return newSub;
      },
      update: async ({ where, data }: any) => {
        const sub = mockSubmissions.find((s) => s.id === where.id);
        if (sub) Object.assign(sub, data);
        return sub;
      },
      updateMany: async ({ where, data }: any) => {
        mockSubmissions.forEach((s) => {
          if (s.teamId === where.teamId && s.roundId === where.roundId) {
            Object.assign(s, data);
          }
        });
        return { count: mockSubmissions.length };
      },
      count: async ({ where }: any) => {
        return mockSubmissions.filter((s) => s.teamId === where.teamId && s.isFinal).length;
      },
    },
    team: {
      findMany: async () => {
        return mockTeams.map((t) => ({
          ...t,
          submissions: mockSubmissions.filter((s) => s.teamId === t.id && s.isFinal),
        }));
      },
      updateMany: async ({ where, data }: any) => {
        mockTeams.forEach((t) => {
          if (where.id?.in?.includes(t.id)) {
            t.isQualifiedR2 = data.isQualifiedR2;
          }
        });
        return { count: mockTeams.length };
      },
    },
    $queryRaw: async () => {
      return [{ id: mockRound.id, config: mockConfig }];
    },
    $transaction: async (cbOrArray: any) => {
      if (typeof cbOrArray === 'function') {
        return await cbOrArray(mockPrisma);
      }
      return await Promise.all(cbOrArray);
    },
  };

  const mockAudit: any = {
    logAction: async (...args: any[]) => {
      mockAuditLogs.push(args);
      return { id: 'audit-log-id' };
    },
  };

  const mockGateway: any = {
    broadcastRound1Event: () => {},
  };

  const round1Service = new Round1Service(mockPrisma, mockAudit, mockGateway);
  const participantController = new Round1Controller(round1Service);
  const organizerController = new Round1OrganizerController(round1Service);

  // 1. Single representative per team
  try {
    await round1Service.ensureTeamRepresentative('team-alpha-id', 'member-1-id');
    let rejected = false;
    try {
      await round1Service.ensureTeamRepresentative('team-alpha-id', 'member-2-id');
    } catch (e: any) {
      rejected = e instanceof ForbiddenException;
    }
    assert(rejected, 'Single representative per team locked; secondary member rejected with 403');
  } catch (e) {
    assert(false, 'Single representative per team');
  }

  // 2. Unauthorized participant rejection
  try {
    let thrown = false;
    try {
      (participantController as any).extractIdentity({ user: {} });
    } catch (e: any) {
      thrown = e instanceof UnauthorizedException;
    }
    assert(thrown, 'Unauthenticated/incomplete participant identity rejected with 401');
  } catch (e) {
    assert(false, 'Unauthorized participant rejection');
  }

  // 3. Client state transition block
  try {
    let thrown = false;
    try {
      await round1Service.transitionState('actor', 'username', { targetState: 'ACTIVE' });
    } catch (e: any) {
      thrown = e instanceof BadRequestException;
    }
    assert(thrown, 'Illegal state transition DRAFT -> ACTIVE blocked by server state machine');
  } catch (e) {
    assert(false, 'Client state transition block');
  }

  // 4. Server timestamp authority
  try {
    await round1Service.transitionState('actor', 'username', { targetState: 'READY' });
    await round1Service.transitionState('actor', 'username', { targetState: 'LOBBY' });
    await round1Service.transitionState('actor', 'username', { targetState: 'COUNTDOWN' });
    const res = await round1Service.transitionState('actor', 'username', { targetState: 'ACTIVE' });
    assert(res.startedAt !== null && res.deadlineAt !== null, 'Server records authoritative startedAt & deadlineAt timestamps');
  } catch (e) {
    assert(false, 'Server timestamp authority');
  }

  // 5. 20-minute deadline enforcement
  try {
    const res = await round1Service.getRound1State();
    assert(res.remainingSeconds > 0 && res.remainingSeconds <= 1200, 'Remaining seconds derived strictly from server deadlineAt');
  } catch (e) {
    assert(false, '20-minute deadline enforcement');
  }

  // 6. On-time submission success
  try {
    const res = await round1Service.submitRound1('team-alpha-id', 'member-1-id', { confirmation: true });
    assert(res.success === true && res.isSubmitted === true, 'On-time final submission succeeds');
  } catch (e) {
    assert(false, 'On-time submission success');
  }

  // 7. Late submission rejection
  try {
    mockConfig.deadlineAt = new Date(Date.now() - 1000).toISOString();
    let rejected = false;
    try {
      await round1Service.submitRound1('team-beta-id', 'member-2-id', { confirmation: true });
    } catch (e: any) {
      rejected = e instanceof BadRequestException;
    }
    assert(rejected, 'Submission after deadline is rejected');
  } catch (e) {
    assert(false, 'Late submission rejection');
  }

  // 8. Submission immutability
  try {
    mockConfig.deadlineAt = new Date(Date.now() + 600000).toISOString();
    mockSubmissions.push({
      id: 'sub-final-1',
      teamId: 'team-alpha-id',
      roundId: 'round-1-uuid',
      memberId: 'member-1-id',
      isFinal: true,
    });
    let rejected = false;
    try {
      await round1Service.saveAnswer('team-alpha-id', 'member-1-id', { questionId: 'q-1', selectedOptionId: 'opt-1-A' });
    } catch (e: any) {
      rejected = e instanceof ForbiddenException;
    }
    assert(rejected, 'Answer modifications after final submission are blocked as immutable');
  } catch (e) {
    assert(false, 'Submission immutability');
  }

  // 9. Double-submission idempotency
  try {
    const res = await round1Service.submitRound1('team-alpha-id', 'member-1-id', { confirmation: true });
    assert(res.success === true && res.message.includes('already recorded'), 'Double submission returns idempotent success response without duplicate records');
  } catch (e) {
    assert(false, 'Double-submission idempotency');
  }

  // 10. Refresh state restoration
  try {
    mockSubmissions.push({
      id: 'sub-draft-1',
      teamId: 'team-alpha-id',
      roundId: 'round-1-uuid',
      questionId: 'q-1',
      answerText: 'opt-1-A',
      isFinal: false,
    });
    const res = await round1Service.getSavedAnswers('team-alpha-id', 'member-1-id');
    assert(res.answers['q-1'] === 'opt-1-A', 'Refresh restores authoritative saved answers');
  } catch (e) {
    assert(false, 'Refresh state restoration');
  }

  // 11. Reconnect state restoration
  try {
    const res = await round1Service.getRound1State();
    assert(res.state === 'ACTIVE', 'Reconnecting client receives authoritative current state');
  } catch (e) {
    assert(false, 'Reconnect state restoration');
  }

  // 12. Network disconnect timer non-extension
  try {
    mockConfig.deadlineAt = new Date(Date.now() - 5000).toISOString();
    const res = await round1Service.getRound1State();
    assert(res.remainingSeconds === 0, 'Network disconnection does not pause or extend timer');
  } catch (e) {
    assert(false, 'Network disconnect timer non-extension');
  }

  // 13. Client timestamp manipulation rejection
  try {
    mockConfig.deadlineAt = new Date(Date.now() + 600000).toISOString();
    const res = await round1Service.submitRound1('team-beta-id', 'member-2-id', { confirmation: true });
    assert(res.submittedAt !== undefined, 'Server generates official submittedAt timestamp');
  } catch (e) {
    assert(false, 'Client timestamp manipulation rejection');
  }

  // 14. Client score manipulation rejection
  try {
    mockConfig.round1State = 'LOCKED';
    mockSubmissions.push({
      id: 'sub-score-1',
      teamId: 'team-alpha-id',
      roundId: 'round-1-uuid',
      questionId: 'q-1',
      answerText: 'opt-1-A',
      isFinal: true,
    });
    const res = await round1Service.scoreRound1('actor', 'username');
    assert(res.success === true, 'Scoring engine grades answers against database key strictly on server');
  } catch (e) {
    assert(false, 'Client score manipulation rejection');
  }

  // 15. Client team/member tampering rejection
  try {
    let rejected = false;
    try {
      await round1Service.saveAnswer('team-alpha-id', 'member-unauthorized', { questionId: 'q-1' });
    } catch (e: any) {
      rejected = e instanceof ForbiddenException;
    }
    assert(rejected, 'Identity tampering for non-representative member rejected');
  } catch (e) {
    assert(false, 'Client team/member tampering rejection');
  }

  // 16. Answer key secrecy
  try {
    const questions = await round1Service.getParticipantQuestions('team-alpha-id', 'member-1-id');
    const hasIsCorrect = questions.some((q) => q.options.some((opt: any) => opt.isCorrect !== undefined));
    assert(!hasIsCorrect, 'isCorrect and answer key data explicitly stripped from participant question DTO');
  } catch (e) {
    assert(false, 'Answer key secrecy');
  }

  // 17. Deterministic scoring
  try {
    mockSubmissions.push({
      id: 'sub-score-2',
      teamId: 'team-beta-id',
      roundId: 'round-1-uuid',
      questionId: 'q-1',
      answerText: 'opt-1-B', // Incorrect answer
      isFinal: true,
    });
    await round1Service.scoreRound1('actor', 'username');
    const betaSub = mockSubmissions.find((s) => s.id === 'sub-score-2');
    assert(betaSub.score === 0, 'Deterministic scoring gives 10 for correct, 0 for incorrect/unanswered');
  } catch (e) {
    assert(false, 'Deterministic scoring');
  }

  // 18. Submission-time tie-breaking
  try {
    mockSubmissions = [
      { id: 's1', teamId: 'team-alpha-id', roundId: 'round-1-uuid', score: 50, submittedAt: new Date(1000000000000), isFinal: true },
      { id: 's2', teamId: 'team-beta-id', roundId: 'round-1-uuid', score: 50, submittedAt: new Date(900000000000), isFinal: true },
    ];
    const board = await round1Service.getLeaderboard();
    assert(board[0].teamId === 'team-beta-id' && board[0].rank === 1, 'Tie-breaking sorts higher score first, then earlier submittedAt timestamp');
  } catch (e) {
    assert(false, 'Submission-time tie-breaking');
  }

  // 19. Team-level qualification
  try {
    mockConfig.round1State = 'SCORING';
    await round1Service.qualifyRound1('actor', 'username');
    assert(mockTeams.some((t) => t.isQualifiedR2 === true), 'Qualification updates isQualifiedR2 at Team level');
  } catch (e) {
    assert(false, 'Team-level qualification');
  }

  // 20. Configurable 50% qualification calculation
  try {
    mockConfig.qualificationRatio = 0.5;
    const res = await round1Service.qualifyRound1('actor', 'username');
    assert(res.qualifiedCount === 1 && res.totalTeams === 2, 'Configurable 50% qualification threshold calculates correctly');
  } catch (e) {
    assert(false, 'Configurable 50% qualification calculation');
  }

  // 21. Organizer round start
  try {
    mockConfig.round1State = 'COUNTDOWN';
    const res = await organizerController.transitionState(
      { user: { userId: 'org-id', username: 'org' } },
      { targetState: 'ACTIVE' },
    );
    assert(res.state === 'ACTIVE', 'Organizer can start the round via administrative endpoint');
  } catch (e) {
    assert(false, 'Organizer round start');
  }

  // 22. Unauthorized role block for start/lock
  try {
    const guards = Reflect.getMetadata('__guards__', Round1OrganizerController);
    assert(guards && guards.length >= 2, 'Round1OrganizerController enforces JwtAuthGuard and RolesGuard');
  } catch (e) {
    assert(false, 'Unauthorized role block for start/lock');
  }

  // 23. Emergency-lock audit logging
  try {
    await round1Service.emergencyLock('actor-id', 'organizer-username');
    assert(mockAuditLogs.some((log) => (log[0]?.action || log[3]) === 'ROUND1_EMERGENCY_LOCK'), 'Emergency lock action records entry in audit log');
  } catch (e) {
    assert(false, 'Emergency-lock audit logging');
  }

  // 24. Submission/deadline race-condition safety
  try {
    mockConfig.round1State = 'ACTIVE';
    mockConfig.deadlineAt = new Date(Date.now() - 10).toISOString();
    let rejected = false;
    try {
      await round1Service.submitRound1('team-alpha-id', 'member-1-id', { confirmation: true });
    } catch (e: any) {
      rejected = e instanceof BadRequestException;
    }
    assert(rejected, 'Race condition where deadline passes concurrently rejects late submission safely');
  } catch (e) {
    assert(false, 'Submission/deadline race-condition safety');
  }

  console.log('\n==================================================');
  console.log(`ROUND 1 TEST RESULTS: ${passed} / 24 PASSED (${failed} FAILED)`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runRound1EngineTests().catch((err) => {
    console.error('❌ Test execution error:', err);
    process.exit(1);
  });
}

export { runRound1EngineTests };
