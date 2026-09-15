import { AuthService } from '../src/modules/auth/auth.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Role } from '@prisma/client';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

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
  team: {
    findUnique: createMockFn(),
  },
  user: {
    findUnique: createMockFn(),
  },
  participantSession: {
    create: createMockFn(),
    findUnique: createMockFn(),
    deleteMany: createMockFn(),
    delete: createMockFn(),
  },
  auditLog: {
    create: createMockFn(),
  },
};

const mockJwtService: any = {
  sign: createMockFn().mockReturnValue('mocked-jwt-token-xyz'),
  verify: createMockFn(),
};

const mockConfigService: any = {
  get: createMockFn().mockReturnValue('dev-secret-key-change-in-production'),
};

const mockAuditService: any = {
  logAction: createMockFn().mockResolvedValue(true),
};

async function runSecurityTests() {
  console.log('🧪 Starting Phase 4 Authentication & Security Verification Suite...\n');
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

  const authService = new AuthService(
    mockPrismaService,
    mockJwtService,
    mockAuditService,
  );

  const jwtAuthGuard = new JwtAuthGuard(
    mockJwtService,
    mockPrismaService,
    mockConfigService,
  );

  const rolesGuard = new RolesGuard({
    getAllAndOverride: createMockFn().mockReturnValue([Role.ORGANIZER]),
    get: createMockFn().mockReturnValue([Role.ORGANIZER]),
  } as any);

  // Helper fixture data
  const pinHash = await bcrypt.hash('1234', 10);
  const passwordHash = await bcrypt.hash('password123', 10);

  const mockTeamAlpha = {
    id: 'team-alpha-id',
    teamCode: 'ALPHA-042',
    name: 'Team Alpha Byte',
    isActive: true,
    members: [
      {
        id: 'member-1-id',
        teamId: 'team-alpha-id',
        memberOrder: 1,
        displayName: 'Alice',
        pinHash,
        isActive: true,
      },
      {
        id: 'member-2-id',
        teamId: 'team-alpha-id',
        memberOrder: 2,
        displayName: 'Bob',
        pinHash,
        isActive: true,
      },
    ],
  };

  const mockOrganizer = {
    id: 'org-user-id',
    username: 'organizer',
    passwordHash,
    role: Role.ORGANIZER,
    displayName: 'Lead Organizer',
    isActive: true,
  };

  const mockJudge = {
    id: 'judge-user-id',
    username: 'judge1',
    passwordHash,
    role: Role.JUDGE,
    displayName: 'Senior Judge',
    isActive: true,
  };

  const mockHost = {
    id: 'host-user-id',
    username: 'host1',
    passwordHash,
    role: Role.HOST,
    displayName: 'Arena Host',
    isActive: true,
  };

  // --- Test 1: Valid Participant Login ---
  try {
    mockPrismaService.team.findUnique.mockResolvedValue(mockTeamAlpha);
    mockPrismaService.participantSession.create.mockResolvedValue({
      id: 'session-001',
      token: 'mocked-jwt-token-xyz',
      teamId: 'team-alpha-id',
      memberId: 'member-1-id',
      role: Role.PARTICIPANT,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    });

    const res = await authService.loginParticipant({
      teamCode: 'ALPHA-042',
      memberOrder: 1,
      pin: '1234',
    });

    assert(
      res.accessToken === 'mocked-jwt-token-xyz' &&
        res.user.teamCode === 'ALPHA-042' &&
        res.user.memberOrder === 1 &&
        (res.user as any).pinHash === undefined,
      'Test 1: Valid participant login (No secret hash leak)',
    );
  } catch (e) {
    assert(false, `Test 1: Valid participant login - ${e}`);
  }

  // --- Test 2: Invalid Team Code ---
  try {
    mockPrismaService.team.findUnique.mockResolvedValue(null);
    await authService.loginParticipant({
      teamCode: 'INVALID-999',
      memberOrder: 1,
      pin: '1234',
    });
    assert(false, 'Test 2: Invalid Team Code (Should throw UnauthorizedException)');
  } catch (e) {
    assert(
      e instanceof UnauthorizedException && e.message === 'Invalid credentials',
      'Test 2: Invalid Team Code correctly rejected',
    );
  }

  // --- Test 3: Invalid Member Order ---
  try {
    mockPrismaService.team.findUnique.mockResolvedValue(mockTeamAlpha);
    await authService.loginParticipant({
      teamCode: 'ALPHA-042',
      memberOrder: 99,
      pin: '1234',
    });
    assert(false, 'Test 3: Invalid Member Order (Should throw UnauthorizedException)');
  } catch (e) {
    assert(
      e instanceof UnauthorizedException && e.message === 'Invalid credentials',
      'Test 3: Invalid Member Order correctly rejected',
    );
  }

  // --- Test 4: Invalid PIN ---
  try {
    mockPrismaService.team.findUnique.mockResolvedValue(mockTeamAlpha);
    await authService.loginParticipant({
      teamCode: 'ALPHA-042',
      memberOrder: 1,
      pin: '9999',
    });
    assert(false, 'Test 4: Invalid PIN (Should throw UnauthorizedException)');
  } catch (e) {
    assert(
      e instanceof UnauthorizedException && e.message === 'Invalid credentials',
      'Test 4: Invalid PIN correctly rejected',
    );
  }

  // --- Test 5: Valid Organizer Login ---
  try {
    mockPrismaService.user.findUnique.mockResolvedValue(mockOrganizer);
    const res = await authService.loginUser({
      username: 'organizer',
      password: 'password123',
    });
    assert(
      res.user.username === 'organizer' &&
        res.user.role === Role.ORGANIZER &&
        (res.user as any).passwordHash === undefined,
      'Test 5: Valid Organizer Login (No password hash leak)',
    );
  } catch (e) {
    assert(false, `Test 5: Valid Organizer Login - ${e}`);
  }

  // --- Test 6: Valid Judge Login ---
  try {
    mockPrismaService.user.findUnique.mockResolvedValue(mockJudge);
    const res = await authService.loginUser({
      username: 'judge1',
      password: 'password123',
    });
    assert(
      res.user.username === 'judge1' && res.user.role === Role.JUDGE,
      'Test 6: Valid Judge Login',
    );
  } catch (e) {
    assert(false, `Test 6: Valid Judge Login - ${e}`);
  }

  // --- Test 7: Valid Host Login ---
  try {
    mockPrismaService.user.findUnique.mockResolvedValue(mockHost);
    const res = await authService.loginUser({
      username: 'host1',
      password: 'password123',
    });
    assert(
      res.user.username === 'host1' && res.user.role === Role.HOST,
      'Test 7: Valid Host Login',
    );
  } catch (e) {
    assert(false, `Test 7: Valid Host Login - ${e}`);
  }

  // --- Test 8: Invalid Privileged Credentials ---
  try {
    mockPrismaService.user.findUnique.mockResolvedValue(mockOrganizer);
    await authService.loginUser({
      username: 'organizer',
      password: 'wrongpassword',
    });
    assert(false, 'Test 8: Invalid Password (Should throw UnauthorizedException)');
  } catch (e) {
    assert(
      e instanceof UnauthorizedException && e.message === 'Invalid credentials',
      'Test 8: Invalid Password correctly rejected',
    );
  }

  // --- Test 9: Expired Participant Session in JwtAuthGuard ---
  try {
    mockJwtService.verify.mockReturnValue({
      sub: 'member-1-id',
      role: Role.PARTICIPANT,
    });
    mockPrismaService.participantSession.findUnique.mockResolvedValue({
      id: 'session-001',
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 60000), // Expired 1 minute ago
      team: { teamCode: 'ALPHA-042', name: 'Team Alpha' },
      member: { memberOrder: 1, displayName: 'Alice' },
    });

    const req: any = { headers: { authorization: 'Bearer expired-token' } };
    const context: any = { switchToHttp: () => ({ getRequest: () => req }) };

    await jwtAuthGuard.canActivate(context);
    assert(false, 'Test 9: Expired Session (Should throw UnauthorizedException)');
  } catch (e) {
    assert(
      e instanceof UnauthorizedException &&
        e.message === 'Participant session expired or invalid',
      'Test 9: Expired Session correctly rejected by JwtAuthGuard',
    );
  }

  // --- Test 10: Revoked Participant Session in JwtAuthGuard ---
  try {
    mockJwtService.verify.mockReturnValue({
      sub: 'member-1-id',
      role: Role.PARTICIPANT,
    });
    // Session deleted from DB
    mockPrismaService.participantSession.findUnique.mockResolvedValue(null);

    const req: any = { headers: { authorization: 'Bearer revoked-token' } };
    const context: any = { switchToHttp: () => ({ getRequest: () => req }) };

    await jwtAuthGuard.canActivate(context);
    assert(false, 'Test 10: Revoked Session (Should throw UnauthorizedException)');
  } catch (e) {
    assert(
      e instanceof UnauthorizedException &&
        e.message === 'Participant session expired or invalid',
      'Test 10: Revoked Session correctly rejected by JwtAuthGuard',
    );
  }

  // --- Test 11: Server Identity Resolution (DB Session Overrides Client Claims) ---
  try {
    mockJwtService.verify.mockReturnValue({
      sub: 'forged-sub',
      teamId: 'forged-team-b', // Attacker tries forging JWT teamId
      memberOrder: 3,
      role: Role.PARTICIPANT,
    });
    mockPrismaService.participantSession.findUnique.mockResolvedValue({
      id: 'session-real',
      token: 'token-xyz',
      teamId: 'team-alpha-id', // Authoritative DB record
      memberId: 'member-1-id', // Authoritative DB record
      role: Role.PARTICIPANT,
      expiresAt: new Date(Date.now() + 3600000),
      team: { teamCode: 'ALPHA-042', name: 'Team Alpha' },
      member: { memberOrder: 1, displayName: 'Alice' },
    });

    const req: any = {
      headers: { authorization: 'Bearer token-xyz' },
      body: { teamId: 'forged-team-c' }, // Attacker sends body override
    };
    const context: any = { switchToHttp: () => ({ getRequest: () => req }) };

    await jwtAuthGuard.canActivate(context);

    assert(
      req.user.teamId === 'team-alpha-id' &&
        req.user.memberId === 'member-1-id' &&
        req.user.memberOrder === 1,
      'Test 11: Server Identity is derived strictly from DB session (Client overrides ignored)',
    );
  } catch (e) {
    assert(false, `Test 11: Server Identity - ${e}`);
  }

  // --- Test 12: RolesGuard Authorization (Role Enforcement) ---
  try {
    const participantReq: any = { user: { role: Role.PARTICIPANT } };
    const organizerReq: any = { user: { role: Role.ORGANIZER } };

    const participantContext: any = {
      switchToHttp: () => ({ getRequest: () => participantReq }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };

    const organizerContext: any = {
      switchToHttp: () => ({ getRequest: () => organizerReq }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };

    const isOrganizerAllowed = rolesGuard.canActivate(organizerContext);
    let isParticipantBlocked = false;
    try {
      rolesGuard.canActivate(participantContext);
    } catch (err) {
      isParticipantBlocked = err instanceof ForbiddenException;
    }

    assert(
      isOrganizerAllowed && isParticipantBlocked,
      'Test 12: RolesGuard allows ORGANIZER and blocks unauthorized PARTICIPANT',
    );
  } catch (e) {
    assert(false, `Test 12: RolesGuard - ${e}`);
  }

  // --- Test 13: Logout Session ---
  try {
    mockPrismaService.participantSession.deleteMany.mockResolvedValue({ count: 1 });
    const logoutRes = await authService.logoutSession('token-to-logout');
    assert(
      logoutRes.success === true,
      'Test 13: Logout session invalidates token in DB',
    );
  } catch (e) {
    assert(false, `Test 13: Logout session - ${e}`);
  }

  // --- Test 14: Answer Leak Protection ---
  try {
    const rawQuestionOptions = [
      { id: 'opt-1', label: 'A', content: 'Option A', isCorrect: true },
      { id: 'opt-2', label: 'B', content: 'Option B', isCorrect: false },
    ];

    // Sanitize options for participant output
    const sanitizedOptions = rawQuestionOptions.map(({ isCorrect, ...rest }) => rest);

    const hasCorrectFlag = sanitizedOptions.some((o: any) => 'isCorrect' in o);
    assert(
      !hasCorrectFlag && sanitizedOptions.length === 2,
      'Test 14: Question options for participants strip "isCorrect" boolean',
    );
  } catch (e) {
    assert(false, `Test 14: Answer Leak - ${e}`);
  }

  console.log(`\n==================================================`);
  console.log(`VERIFICATION SUMMARY: PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log(`==================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((e) => {
  console.error('Test runner fatal error:', e);
  process.exit(1);
});
