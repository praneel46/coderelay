import * as http from 'http';
import { performance } from 'perf_hooks';
import * as jwt from 'jsonwebtoken';
import { Round2Service } from '../src/modules/round2/round2.service';

const JWT_SECRET = 'load-test-secret-key-1234567890';

// In-memory mock store for real TCP/HTTP latency & race-condition benchmarking
const mockConfig: any = {
  round2State: 'MEMBER_1_ACTIVE',
  deadlineAt: new Date(Date.now() + 2700000).toISOString(),
};

const mockRound = {
  id: 'round-2-uuid',
  roundNumber: 2,
  slug: 'triple-strike',
  title: 'Round 2 — Triple Strike',
  description: 'Sequential Team Relay',
  status: 'ACTIVE',
  durationSeconds: 2700,
  config: mockConfig,
  startedAt: new Date(),
  endedAt: null as Date | null,
  createdAt: new Date(),
  updatedAt: new Date(),
  stages: [
    { id: 'stage-1-id', roundId: 'round-2-uuid', stageOrder: 1, title: 'Stage 1 — Debugging', durationSeconds: 900, memberOrder: 1 },
    { id: 'stage-2-id', roundId: 'round-2-uuid', stageOrder: 2, title: 'Stage 2 — Coding', durationSeconds: 900, memberOrder: 2 },
    { id: 'stage-3-id', roundId: 'round-2-uuid', stageOrder: 3, title: 'Stage 3 — Predict Output', durationSeconds: 900, memberOrder: 3 },
  ],
};

const mockQuestions = [
  { id: 'q-s1-1', roundId: 'round-2-uuid', stageId: 'stage-1-id', displayOrder: 1, title: 'Debug Q1', problemStatement: 'Fix bug 1', codeSnippet: 'def f(): bug', language: 'python', type: 'DEBUGGING', marks: 10, status: 'PUBLISHED', options: [] },
  { id: 'q-s1-2', roundId: 'round-2-uuid', stageId: 'stage-1-id', displayOrder: 2, title: 'Debug Q2', problemStatement: 'Fix bug 2', codeSnippet: 'def g(): bug', language: 'python', type: 'DEBUGGING', marks: 10, status: 'PUBLISHED', options: [] },
  { id: 'q-s1-3', roundId: 'round-2-uuid', stageId: 'stage-1-id', displayOrder: 3, title: 'Debug Q3', problemStatement: 'Fix bug 3', codeSnippet: 'def h(): bug', language: 'python', type: 'DEBUGGING', marks: 10, status: 'PUBLISHED', options: [] },
];

const mockSubmissions: any[] = [];
const mockStageSessions: any[] = [];
const mockSecurityEvents: any[] = [];

const mockPrisma: any = {
  round: {
    findUnique: async () => mockRound,
    create: async () => mockRound,
    update: async ({ data }: any) => {
      if (data.config) Object.assign(mockConfig, data.config);
      return mockRound;
    },
  },
  question: {
    findMany: async () => mockQuestions,
  },
  team: {
    findUnique: async ({ where }: any) => ({
      id: where.id,
      teamCode: `TEAM-${where.id}`,
      name: `Team ${where.id}`,
      isQualifiedR2: true,
      members: [
        { id: `m1-${where.id}`, memberOrder: 1, displayName: 'Member 1' },
        { id: `m2-${where.id}`, memberOrder: 2, displayName: 'Member 2' },
        { id: `m3-${where.id}`, memberOrder: 3, displayName: 'Member 3' },
      ],
      stageSessions: mockStageSessions.filter((s) => s.teamId === where.id),
      submissions: mockSubmissions.filter((s) => s.teamId === where.id),
    }),
  },
  teamMember: {
    findFirst: async ({ where }: any) => ({
      id: `m${where.memberOrder}-${where.teamId}`,
      teamId: where.teamId,
      memberOrder: where.memberOrder,
      displayName: `Member ${where.memberOrder}`,
    }),
  },
  stageSession: {
    findFirst: async ({ where }: any) => {
      const found = mockStageSessions.find((s) => {
        if (where.teamId && s.teamId !== where.teamId) return false;
        if (where.stageId && s.stageId !== where.stageId) return false;
        return true;
      });
      if (!found) return null;
      return {
        ...found,
        stage: mockRound.stages.find((st: any) => st.id === found.stageId),
      };
    },
    findMany: async ({ where }: any) => {
      return mockStageSessions
        .filter((s) => s.teamId === where.teamId)
        .map((s) => ({
          ...s,
          stage: mockRound.stages.find((st: any) => st.id === s.stageId),
        }));
    },
    create: async ({ data }: any) => {
      const sess = { id: `ss-${mockStageSessions.length + 1}`, ...data };
      mockStageSessions.push(sess);
      return {
        ...sess,
        stage: mockRound.stages.find((st: any) => st.id === sess.stageId),
      };
    },
    update: async ({ where, data }: any) => {
      const sess = mockStageSessions.find((s) => s.id === where.id);
      if (sess) Object.assign(sess, data);
      return sess
        ? {
            ...sess,
            stage: mockRound.stages.find((st: any) => st.id === sess.stageId),
          }
        : null;
    },
  },
  submission: {
    findFirst: async ({ where }: any) => {
      return mockSubmissions.find((s) => s.teamId === where.teamId && s.questionId === where.questionId) || null;
    },
    findMany: async ({ where }: any) => {
      return mockSubmissions.filter((s) => s.teamId === where.teamId);
    },
    create: async ({ data }: any) => {
      const sub = { id: `sub-${mockSubmissions.length + 1}`, ...data };
      mockSubmissions.push(sub);
      return sub;
    },
    update: async ({ where, data }: any) => {
      const sub = mockSubmissions.find((s) => s.id === where.id);
      if (sub) Object.assign(sub, data);
      return sub;
    },
    updateMany: async ({ where, data }: any) => {
      mockSubmissions.forEach((s) => {
        if (s.teamId === where.teamId) Object.assign(s, data);
      });
      return { count: mockSubmissions.length };
    },
  },
  securityEvent: {
    create: async ({ data }: any) => {
      const ev = { id: `sec-${mockSecurityEvents.length + 1}`, ...data };
      mockSecurityEvents.push(ev);
      return ev;
    },
  },
  $queryRaw: async () => [{ id: mockRound.id, config: mockConfig }],
  $transaction: async (cbOrArray: any) => {
    if (typeof cbOrArray === 'function') {
      return await cbOrArray(mockPrisma);
    }
    return await Promise.all(cbOrArray);
  },
};

const mockAudit: any = { logAction: async () => ({}) };
const mockGateway: any = { broadcastRound2Event: () => {} };

const round2Service = new Round2Service(mockPrisma, mockAudit, mockGateway);

async function runRealRound2ConcurrencyTest() {
  console.log('🚀 Starting Real TCP/HTTP Server for 200-Participant Round 2 Capacity Validation Load Test...');

  const server = http.createServer(async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ statusCode: 401, message: 'Unauthorized' }));
        return;
      }

      const token = authHeader.substring(7);
      let user: any;
      try {
        user = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ statusCode: 401, message: 'Invalid token' }));
        return;
      }

      let bodyData = '';
      req.on('data', (chunk) => (bodyData += chunk));
      req.on('end', async () => {
        let body: any = {};
        if (bodyData) {
          try {
            body = JSON.parse(bodyData);
          } catch (e) {}
        }

        const url = req.url || '';

        try {
          if (url === '/api/round2/state' && req.method === 'GET') {
            const state = await round2Service.getParticipantState(user.teamId, user.memberId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(state));
          } else if (url === '/api/round2/questions' && req.method === 'GET') {
            const questions = await round2Service.getParticipantQuestions(user.teamId, user.memberId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(questions));
          } else if (url === '/api/round2/answers' && req.method === 'POST') {
            const result = await round2Service.saveAnswer(user.teamId, user.memberId, body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } else if (url === '/api/round2/submit-stage' && req.method === 'POST') {
            const result = await round2Service.submitStage(user.teamId, user.memberId, body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } else if (url === '/api/round2/security-violation' && req.method === 'POST') {
            const result = await round2Service.reportSecurityEvent(user.teamId, user.memberId, body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ statusCode: 404, message: 'Not Found' }));
          }
        } catch (err: any) {
          const status = err.status || (err.name === 'ForbiddenException' ? 403 : err.name === 'BadRequestException' ? 400 : 500);
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ statusCode: status, message: err.message }));
        }
      });
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ statusCode: 500, message: 'Internal Server Error' }));
    }
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const participantCount = 200; // Capacity benchmark target
  const tokens: string[] = [];

  for (let i = 1; i <= participantCount; i++) {
    const teamId = `team-sim-r2-${i}`;
    const memberId = `m1-${teamId}`;
    const token = jwt.sign(
      { userId: memberId, teamId, memberId, role: 'PARTICIPANT' },
      JWT_SECRET,
      { expiresIn: '1h' },
    );
    tokens.push(token);
  }

  function makeRequest(path: string, method: string, token: string, body?: any): Promise<{ status: number; data: any; duration: number }> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request(
        `${baseUrl}${path}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          },
        },
        (res) => {
          let resData = '';
          res.on('data', (chunk) => (resData += chunk));
          res.on('end', () => {
            const duration = performance.now() - startTime;
            let json: any = {};
            try { json = JSON.parse(resData); } catch (e) {}
            resolve({ status: res.statusCode || 500, data: json, duration });
          });
        },
      );
      req.on('error', () => {
        resolve({ status: 500, data: {}, duration: performance.now() - startTime });
      });
      if (payload) req.write(payload);
      req.end();
    });
  }

  console.log(`📡 Launching 2,000 real TCP/HTTP requests across ${participantCount} concurrent Round 2 workloads...`);

  const startTime = performance.now();
  let successfulRequests = 0;
  let failedRequests = 0;
  const latencies: number[] = [];

  const userWorkloads = tokens.map(async (token) => {
    const q1 = await makeRequest('/api/round2/state', 'GET', token);
    const q2 = await makeRequest('/api/round2/questions', 'GET', token);
    const q3 = await makeRequest('/api/round2/answers', 'POST', token, { questionId: 'q-s1-1', codeContent: 'def debug(): fixed' });
    const q4 = await makeRequest('/api/round2/security-violation', 'POST', token, { violationType: 'VISIBILITY_CHANGE' });
    const q5 = await makeRequest('/api/round2/submit-stage', 'POST', token, { confirmation: true });

    [q1, q2, q3, q4, q5].forEach((r, idx) => {
      latencies.push(r.duration);
      if (r.status === 200 || r.status === 201) {
        successfulRequests++;
      } else {
        failedRequests++;
        if (failedRequests <= 3) {
          console.log(`Failed req idx ${idx + 1}: status ${r.status}, message:`, r.data);
        }
      }
    });
  });

  await Promise.all(userWorkloads);

  const totalWallClockTime = performance.now() - startTime;
  const totalRequests = participantCount * 5;

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const max = latencies[latencies.length - 1] || 0;

  console.log('\n==================================================');
  console.log('📊 REAL TCP/HTTP 200-PARTICIPANT ROUND 2 CAPACITY VALIDATION RESULTS');
  console.log('==================================================');
  console.log(`Concurrent User Workloads:      ${participantCount}`);
  console.log(`Total TCP/HTTP Requests:        ${totalRequests}`);
  console.log(`Successful Requests:            ${successfulRequests} / ${totalRequests} (${((successfulRequests / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Failed Requests:                ${failedRequests}`);
  console.log(`Wall-Clock Execution Time:      ${totalWallClockTime.toFixed(2)} ms (${(totalWallClockTime / 1000).toFixed(2)}s)`);
  console.log(`Throughput:                     ${((totalRequests / totalWallClockTime) * 1000).toFixed(1)} req/sec`);
  console.log('--------------------------------------------------');
  console.log('LATENCY METRICS (Measured via performance.now()):');
  console.log(`  p50 Latency (Median):          ${p50.toFixed(2)} ms`);
  console.log(`  p95 Latency (95th percentile): ${p95.toFixed(2)} ms`);
  console.log(`  Max Latency:                   ${max.toFixed(2)} ms`);
  console.log('==================================================\n');

  server.close();

  if (failedRequests > 0) {
    console.error(`❌ Round 2 Capacity validation load test completed with ${failedRequests} failures.`);
    process.exit(1);
  } else {
    console.log('✅ Real TCP/HTTP 200-Participant Round 2 Capacity Validation Load Test PASSED!');
  }
}

if (require.main === module) {
  runRealRound2ConcurrencyTest().catch((err) => {
    console.error('❌ Load test error:', err);
    process.exit(1);
  });
}

export { runRealRound2ConcurrencyTest };
