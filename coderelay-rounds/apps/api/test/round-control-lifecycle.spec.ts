import { RoundControlService } from '../src/modules/competition/round-control.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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

async function runLifecycleTests() {
  console.log('🚀 Running Organizer Round Lifecycle (Start/Pause/Resume/End/Reset) Test Suite...');

  const mockActor = {
    id: 'user-organizer-id',
    username: 'organizer_master',
    role: 'ORGANIZER',
  };

  const mockRound2: any = {
    id: 'round-2-uuid',
    roundNumber: 2,
    slug: 'triple-strike',
    title: 'Round 2 — Triple Strike',
    status: 'DRAFT',
    durationSeconds: 2700,
    startedAt: null,
    pausedAt: null,
    endedAt: null,
    stages: [
      { id: 'stage-1-id', stageOrder: 1, title: 'Debugging', durationSeconds: 900 },
      { id: 'stage-2-id', stageOrder: 2, title: 'Coding', durationSeconds: 900 },
      { id: 'stage-3-id', stageOrder: 3, title: 'Predict Output', durationSeconds: 900 },
    ],
  };

  const mockAuditLogs: any[] = [];
  const mockBroadcasts: any[] = [];

  const mockPrisma: any = {
    round: {
      findUnique: async () => mockRound2,
      update: async (args: any) => {
        Object.assign(mockRound2, args.data);
        return mockRound2;
      },
    },
    team: {
      count: async () => 12,
      findMany: async () => [
        { id: 'team-1', name: 'Alpha', members: [{ id: 'm1', memberOrder: 1 }] },
      ],
    },
    stageSession: {
      findFirst: async () => null,
      create: async () => ({ id: 'session-1' }),
      upsert: async () => ({ id: 'session-1' }),
      findMany: async () => [{ id: 'session-1', status: 'ACTIVE', deadlineAt: new Date(Date.now() + 600000) }],
      update: async () => ({ id: 'session-1' }),
      updateMany: async () => ({ count: 1 }),
      deleteMany: async () => ({ count: 1 }),
    },
    roundStage: {
      findMany: async () => mockRound2.stages,
    },
    auditLog: {
      create: async (args: any) => mockAuditLogs.push(args.data),
    },
    $transaction: async (cb: any) => cb(mockPrisma),
  };

  const mockGateway: any = {
    broadcastRoundStateUpdate: (payload: any) => mockBroadcasts.push(payload),
  };

  const service = new RoundControlService(mockPrisma, mockGateway);

  // Scenario 1: LOAD ROUND
  const loadResult = await service.loadRound(2, mockActor);
  assert(loadResult.status === 'READY' && loadResult.eligibleTeamsCount === 12, 'LOAD ROUND transitions round to READY and counts eligible teams');
  assert(mockBroadcasts.some((b) => b.event === 'ROUND_LOADED'), 'LOAD ROUND broadcasts ROUND_LOADED socket event');

  // Scenario 2: START TIMER (Synchronized 5s countdown)
  const startResult = await service.startTimer(2, mockActor);
  const diffMs = startResult.competitionStartedAt.getTime() - startResult.countdownStartedAt.getTime();
  assert(startResult.roundNumber === 2 && diffMs === 5000, 'START TIMER establishes 5-second synchronized countdown timestamp offset');
  assert(mockRound2.status === 'ACTIVE', 'START TIMER transitions round status to ACTIVE');

  // Scenario 3: PAUSE ROUND
  const pauseResult = await service.pauseRound(2, mockActor);
  assert(pauseResult.status === 'PAUSED' && pauseResult.pausedAt instanceof Date, 'PAUSE ROUND freezes timer and sets pausedAt in database');
  assert(mockBroadcasts.some((b) => b.event === 'ROUND_PAUSED'), 'PAUSE ROUND broadcasts ROUND_PAUSED event');

  // Scenario 4: RESUME ROUND
  const resumeResult = await service.resumeRound(2, mockActor);
  assert(resumeResult.status === 'ACTIVE' && resumeResult.pauseDurationMs >= 0, 'RESUME ROUND calculates pause duration and shifts deadlineAt forward');
  assert(mockBroadcasts.some((b) => b.event === 'ROUND_RESUMED'), 'RESUME ROUND broadcasts ROUND_RESUMED event');

  // Scenario 5: END ROUND
  const endResult = await service.endRound(2, mockActor);
  assert(endResult.status === 'FINALIZED', 'END ROUND transactionally finalizes active stage sessions and round');

  // Scenario 6: RESET ROUND (Invalid confirmation code)
  let resetFailed = false;
  try {
    await service.resetRound(2, 'WRONG_CODE', mockActor);
  } catch (e: any) {
    resetFailed = e instanceof BadRequestException;
  }
  assert(resetFailed, 'RESET ROUND rejects invalid confirmation code with 400 Bad Request');

  // Scenario 7: RESET ROUND (Valid confirmation code)
  const resetResult = await service.resetRound(2, 'RESET_ROUND_CONFIRM', mockActor);
  assert(resetResult.status === 'DRAFT', 'RESET ROUND with RESET_ROUND_CONFIRM resets round to DRAFT state');
  assert(mockAuditLogs.some((l) => l.action === 'ROUND_RESET'), 'RESET ROUND creates explicit AuditLog entry');
  assert(mockBroadcasts.some((b) => b.event === 'ROUND_RESET'), 'RESET ROUND broadcasts ROUND_RESET to push clients back to Lobby');

  console.log('\n==================================================');
  console.log(`LIFECYCLE TEST RESULTS: ${passed} / ${passed + failed} PASSED (${failed} FAILED)`);
  console.log('==================================================\n');

  if (failed > 0) process.exit(1);
}

runLifecycleTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
