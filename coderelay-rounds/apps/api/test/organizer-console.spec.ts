import { QuestionsService } from '../src/modules/questions/questions.service';
import { TeamsService } from '../src/modules/teams/teams.service';
import { RoundsService } from '../src/modules/rounds/rounds.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Role, QuestionType, QuestionStatus } from '@prisma/client';
import {
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

// Simple mock helper
function createMockFn(defaultReturn?: any) {
  let currentReturn = defaultReturn;
  const mock: any = (...args: any[]) => {
    mock.calls.push(args);
    if (typeof mock.implementation === 'function') {
      return mock.implementation(...args);
    }
    return currentReturn;
  };
  mock.calls = [] as any[];
  mock.mockResolvedValue = (val: any) => {
    mock.implementation = () => Promise.resolve(val);
    return mock;
  };
  mock.mockReturnValue = (val: any) => {
    mock.implementation = () => val;
    return mock;
  };
  return mock;
}

const mockPrismaService: any = {
  round: {
    findUnique: createMockFn(),
    findMany: createMockFn(),
    update: createMockFn(),
  },
  roundStage: {
    findUnique: createMockFn(),
  },
  team: {
    findUnique: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
  },
  question: {
    findUnique: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
  },
  questionOption: {
    deleteMany: createMockFn(),
  },
  submission: {
    findMany: createMockFn(),
    count: createMockFn(),
  },
  auditLog: {
    create: createMockFn(),
  },
};

const mockAuditService: any = {
  logAction: createMockFn().mockResolvedValue(true),
};

async function runOrganizerConsoleTests() {
  console.log('🧪 Starting Phase 5 Final Security & Architecture Verification Suite...\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
      failedCount++;
    }
  }

  const questionsService = new QuestionsService(mockPrismaService, mockAuditService);
  const teamsService = new TeamsService(mockPrismaService, mockAuditService);
  const roundsService = new RoundsService(mockPrismaService, mockAuditService);

  const rolesGuard = new RolesGuard({
    getAllAndOverride: createMockFn().mockReturnValue([Role.ORGANIZER]),
    get: createMockFn().mockReturnValue([Role.ORGANIZER]),
  } as any);

  // --- Test 1: Organizer role authorized for organizer routes ---
  try {
    const orgReq: any = { user: { role: Role.ORGANIZER } };
    const context: any = {
      switchToHttp: () => ({ getRequest: () => orgReq }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    const isAllowed = rolesGuard.canActivate(context);
    assert(isAllowed === true, 'Test 1: Organizer role authorized for organizer routes');
  } catch (e) {
    assert(false, `Test 1: Organizer access - ${e}`);
  }

  // --- Test 2: Participant correctly blocked from organizer routes ---
  try {
    const partReq: any = { user: { role: Role.PARTICIPANT } };
    const context: any = {
      switchToHttp: () => ({ getRequest: () => partReq }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    rolesGuard.canActivate(context);
    assert(false, 'Test 2: Participant should be blocked from organizer routes');
  } catch (e) {
    assert(
      e instanceof ForbiddenException,
      'Test 2: Participant correctly blocked with ForbiddenException',
    );
  }

  // --- Test 3: Judge blocked from organizer-only routes ---
  try {
    const judgeReq: any = { user: { role: Role.JUDGE } };
    const context: any = {
      switchToHttp: () => ({ getRequest: () => judgeReq }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    rolesGuard.canActivate(context);
    assert(false, 'Test 3: Judge should be blocked from organizer-only routes');
  } catch (e) {
    assert(
      e instanceof ForbiddenException,
      'Test 3: Judge correctly blocked with ForbiddenException',
    );
  }

  // --- Test 4: Host blocked from organizer-only routes ---
  try {
    const hostReq: any = { user: { role: Role.HOST } };
    const context: any = {
      switchToHttp: () => ({ getRequest: () => hostReq }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    rolesGuard.canActivate(context);
    assert(false, 'Test 4: Host should be blocked from organizer-only routes');
  } catch (e) {
    assert(
      e instanceof ForbiddenException,
      'Test 4: Host correctly blocked with ForbiddenException',
    );
  }

  // --- Test 5: Team Creation requires exactly 3 members ---
  try {
    await teamsService.createTeam(
      {
        teamCode: 'TEST-001',
        name: 'Invalid Team',
        members: [
          { memberOrder: 1, displayName: 'Alice', pin: '1234' },
          { memberOrder: 2, displayName: 'Bob', pin: '1234' },
        ],
      },
      'organizer',
    );
    assert(false, 'Test 5: Team creation with 2 members should fail');
  } catch (e) {
    assert(
      e instanceof BadRequestException && e.message.includes('exactly 3 team members'),
      'Test 5: Team creation with invalid member count correctly rejected',
    );
  }

  // --- Test 6: Team Creation requires explicit member orders 1, 2, 3 ---
  try {
    await teamsService.createTeam(
      {
        teamCode: 'TEST-002',
        name: 'Invalid Order Team',
        members: [
          { memberOrder: 1, displayName: 'Alice', pin: '1234' },
          { memberOrder: 1, displayName: 'Bob Duplicate', pin: '1234' },
          { memberOrder: 3, displayName: 'Charlie', pin: '1234' },
        ],
      },
      'organizer',
    );
    assert(false, 'Test 6: Duplicate member order should fail');
  } catch (e) {
    assert(
      e instanceof BadRequestException && e.message.includes('explicit member orders 1, 2, and 3'),
      'Test 6: Team creation with duplicate member order correctly rejected',
    );
  }

  // --- Test 7: Team PIN hashes never leak in API response ---
  try {
    mockPrismaService.team.findUnique.mockResolvedValue(null);
    mockPrismaService.team.create.mockResolvedValue({
      id: 'team-created-id',
      teamCode: 'ALPHA-001',
      name: 'Team Alpha',
      members: [
        { id: 'm1', memberOrder: 1, displayName: 'Alice', isActive: true },
        { id: 'm2', memberOrder: 2, displayName: 'Bob', isActive: true },
        { id: 'm3', memberOrder: 3, displayName: 'Charlie', isActive: true },
      ],
    });

    const teamRes = await teamsService.createTeam(
      {
        teamCode: 'ALPHA-001',
        name: 'Team Alpha',
        members: [
          { memberOrder: 1, displayName: 'Alice', pin: '1234' },
          { memberOrder: 2, displayName: 'Bob', pin: '1234' },
          { memberOrder: 3, displayName: 'Charlie', pin: '1234' },
        ],
      },
      'organizer',
    );

    const hasPinHash = teamRes.members.some((m: any) => 'pinHash' in m || 'pin' in m);
    assert(!hasPinHash, 'Test 7: Team PIN hashes never appear in API responses');
  } catch (e) {
    assert(false, `Test 7: Team PIN secrecy - ${e}`);
  }

  // --- Test 8: Create Question initializes in DRAFT state ---
  try {
    mockPrismaService.round.findUnique.mockResolvedValue({ id: 'round-1-id', title: 'Round 1' });
    mockPrismaService.question.create.mockResolvedValue({
      id: 'q-draft-001',
      roundId: 'round-1-id',
      title: 'Sample MCQ Question',
      problemStatement: 'What is O(1)?',
      type: QuestionType.MCQ,
      marks: 10,
      status: QuestionStatus.DRAFT,
      options: [
        { label: 'A', content: 'Constant time', isCorrect: true },
        { label: 'B', content: 'Linear time', isCorrect: false },
      ],
    });

    const q = await questionsService.createQuestion(
      {
        roundId: 'round-1-id',
        title: 'Sample MCQ Question',
        description: 'What is O(1)?',
        type: QuestionType.MCQ,
        options: [
          { label: 'A', content: 'Constant time', isCorrect: true },
          { label: 'B', content: 'Linear time', isCorrect: false },
        ],
      },
      'organizer',
    );

    assert(
      q.id === 'q-draft-001' && (q as any).status === QuestionStatus.DRAFT,
      'Test 8: Create question initializes in DRAFT state',
    );
  } catch (e) {
    assert(false, `Test 8: Create question - ${e}`);
  }

  // --- Test 9: Stale updatedAt Optimistic Concurrency Check ---
  try {
    mockPrismaService.question.findUnique.mockResolvedValue({
      id: 'q-draft-001',
      title: 'Original Title',
      problemStatement: 'Statement',
      status: QuestionStatus.DRAFT,
      updatedAt: new Date('2026-09-14T10:00:00Z'),
    });

    await questionsService.updateQuestion(
      'q-draft-001',
      {
        title: 'Stale Update',
        expectedUpdatedAt: '2026-09-14T09:00:00Z', // Stale timestamp
      },
      'organizer',
    );
    assert(false, 'Test 9: Stale updatedAt mutation should be rejected');
  } catch (e) {
    assert(
      e instanceof ConflictException && e.message.includes('modified by another organizer'),
      'Test 9: Stale updatedAt mutation correctly rejected with ConflictException (409)',
    );
  }

  // --- Test 10: Locked question cannot be normally edited ---
  try {
    mockPrismaService.question.findUnique.mockResolvedValue({
      id: 'q-locked-001',
      title: 'Locked Question',
      status: QuestionStatus.LOCKED,
    });

    await questionsService.updateQuestion(
      'q-locked-001',
      { title: 'Attempted Change' },
      'organizer',
    );
    assert(false, 'Test 10: Locked question edit should be rejected');
  } catch (e) {
    assert(
      e instanceof ForbiddenException && e.message.includes('LOCKED'),
      'Test 10: Editing LOCKED question correctly rejected with ForbiddenException',
    );
  }

  // --- Test 11: Duplicating locked question creates a new DRAFT copy ---
  try {
    mockPrismaService.question.findUnique.mockResolvedValue({
      id: 'q-locked-001',
      roundId: 'r1',
      stageId: null,
      title: 'Locked Question',
      problemStatement: 'Problem',
      type: QuestionType.MCQ,
      marks: 10,
      codeSnippet: null,
      language: 'python',
      options: [{ label: 'A', content: 'Opt A', isCorrect: true }],
    });

    mockPrismaService.question.create.mockResolvedValue({
      id: 'q-copy-001',
      title: 'Locked Question (Copy)',
      status: QuestionStatus.DRAFT,
      options: [{ label: 'A', content: 'Opt A', isCorrect: true }],
    });

    const copy = await questionsService.duplicateQuestion('q-locked-001', 'organizer');
    assert(
      copy.id === 'q-copy-001' && (copy as any).status === QuestionStatus.DRAFT,
      'Test 11: Duplicating locked question creates new DRAFT copy',
    );
  } catch (e) {
    assert(false, `Test 11: Duplicating locked question - ${e}`);
  }

  // --- Test 12: Participant cannot access questions assigned to another member order ---
  try {
    const member1User = {
      role: Role.PARTICIPANT,
      teamId: 'team-a',
      memberId: 'mem-1',
      memberOrder: 1, // Member 1
    };

    mockPrismaService.roundStage.findUnique.mockResolvedValue({
      id: 'stage-m2',
      stageOrder: 2,
      memberOrder: 2, // Assigned to Member 2
    });

    await questionsService.getQuestionsForParticipant(member1User, 'r2', 'stage-m2');
    assert(false, 'Test 12: Member 1 accessing Member 2 stage should fail');
  } catch (e) {
    assert(
      e instanceof ForbiddenException && e.message.includes('not authorized to access Stage'),
      'Test 12: Member 1 attempting to access Member 2 stage correctly rejected with ForbiddenException',
    );
  }

  // --- Test 13: Participant API response completely strips isCorrect ---
  try {
    const member1User = {
      role: Role.PARTICIPANT,
      teamId: 'team-a',
      memberId: 'mem-1',
      memberOrder: 1,
    };

    mockPrismaService.question.findMany = createMockFn().mockResolvedValue([
      {
        id: 'q-pub-100',
        roundId: 'r1',
        title: 'Binary Search',
        problemStatement: 'Complexity?',
        type: QuestionType.MCQ,
        marks: 10,
        status: QuestionStatus.PUBLISHED,
        codeSnippet: null,
        language: 'python',
        options: [
          { id: 'o1', label: 'A', content: 'O(N)', isCorrect: false, displayOrder: 1 },
          { id: 'o2', label: 'B', content: 'O(log N)', isCorrect: true, displayOrder: 2 },
        ],
      },
    ]);

    const participantQs = await questionsService.getQuestionsForParticipant(member1User, 'r1');
    const firstOpt = participantQs[0]?.options?.[0] as any;

    assert(
      firstOpt !== undefined && !('isCorrect' in firstOpt),
      'Test 13: Participant API response completely strips "isCorrect" boolean',
    );
  } catch (e) {
    assert(false, `Test 13: Participant API answer leak check - ${e}`);
  }

  // --- Test 14: Audit Log Generation for important actions ---
  try {
    mockPrismaService.round.findUnique.mockResolvedValue({ id: 'r1' });
    mockPrismaService.question.create.mockResolvedValue({
      id: 'q-audit-001',
      title: 'Audited Question',
      type: QuestionType.CODING,
    });

    await questionsService.createQuestion(
      {
        roundId: 'r1',
        title: 'Audited Question',
        description: 'Audit Test',
        type: QuestionType.CODING,
      },
      'test_organizer',
    );

    const logCalls = mockAuditService.logAction.calls;
    const lastCall = logCalls[logCalls.length - 1][0];

    assert(
      lastCall.action === 'CREATE_QUESTION' && lastCall.actorUsername === 'test_organizer',
      'Test 14: AuditLog entry recorded for question creation',
    );
  } catch (e) {
    assert(false, `Test 14: Audit Log - ${e}`);
  }

  console.log(`\n==================================================`);
  console.log(`VERIFICATION SUMMARY: PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log(`==================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runOrganizerConsoleTests().catch((e) => {
  console.error('Test runner fatal error:', e);
  process.exit(1);
});
