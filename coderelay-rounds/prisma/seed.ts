import { PrismaClient, Role, RoundType, RoundStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Code Relay database seeding...');

  // Production Safety Gate
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error(
      '❌ SEED ABORTED: Database seeding in production is disabled unless ALLOW_PRODUCTION_SEED=true is explicitly set.',
    );
  }

  // Resolve seed secrets from environment variables or safe dev defaults
  const organizerPassword =
    process.env.SEED_ORGANIZER_PASSWORD || (isProduction ? '' : 'password123');
  const judgePassword =
    process.env.SEED_JUDGE_PASSWORD || (isProduction ? '' : 'password123');
  const hostPassword =
    process.env.SEED_HOST_PASSWORD || (isProduction ? '' : 'password123');
  const memberPin =
    process.env.SEED_MEMBER_PIN || (isProduction ? '' : '1234');

  if (isProduction && (!organizerPassword || !judgePassword || !hostPassword || !memberPin)) {
    throw new Error(
      '❌ SEED ABORTED: In production mode, SEED_ORGANIZER_PASSWORD, SEED_JUDGE_PASSWORD, SEED_HOST_PASSWORD, and SEED_MEMBER_PIN environment variables must be explicitly defined.',
    );
  }

  // Hash default passwords and PINs securely using bcrypt (salt factor = 10)
  const organizerPasswordHash = await bcrypt.hash(organizerPassword, 10);
  const judgePasswordHash = await bcrypt.hash(judgePassword, 10);
  const hostPasswordHash = await bcrypt.hash(hostPassword, 10);
  const defaultPinHash = await bcrypt.hash(memberPin, 10);

  // 1. Seed Console Users (Organizer, Judge, Host)
  const organizer = await prisma.user.upsert({
    where: { username: 'organizer' },
    update: {},
    create: {
      username: 'organizer',
      passwordHash: organizerPasswordHash,
      role: Role.ORGANIZER,
      displayName: 'Lead Organizer',
    },
  });

  const judge = await prisma.user.upsert({
    where: { username: 'judge1' },
    update: {},
    create: {
      username: 'judge1',
      passwordHash: judgePasswordHash,
      role: Role.JUDGE,
      displayName: 'Senior Code Judge',
    },
  });

  const host = await prisma.user.upsert({
    where: { username: 'host1' },
    update: {},
    create: {
      username: 'host1',
      passwordHash: hostPasswordHash,
      role: Role.HOST,
      displayName: 'Live Arena Host',
    },
  });

  console.log('✅ Seeded Console Users:', {
    organizer: organizer.username,
    judge: judge.username,
    host: host.username,
  });

  // 2. Seed Sample Teams & Members
  const teamAlpha = await prisma.team.upsert({
    where: { teamCode: 'ALPHA-042' },
    update: {},
    create: {
      teamCode: 'ALPHA-042',
      name: 'Team Alpha Byte',
      college: 'Vidyantra Institute of Tech',
      members: {
        create: [
          {
            memberOrder: 1,
            displayName: 'Alice (Debugger)',
            pinHash: defaultPinHash,
          },
          {
            memberOrder: 2,
            displayName: 'Bob (Coder)',
            pinHash: defaultPinHash,
          },
          {
            memberOrder: 3,
            displayName: 'Charlie (Predictor)',
            pinHash: defaultPinHash,
          },
        ],
      },
    },
  });

  const teamBeta = await prisma.team.upsert({
    where: { teamCode: 'BETA-099' },
    update: {},
    create: {
      teamCode: 'BETA-099',
      name: 'Team Beta Syntax',
      college: 'Vidyantra School of Engineering',
      members: {
        create: [
          {
            memberOrder: 1,
            displayName: 'David (Debugger)',
            pinHash: defaultPinHash,
          },
          {
            memberOrder: 2,
            displayName: 'Eve (Coder)',
            pinHash: defaultPinHash,
          },
          {
            memberOrder: 3,
            displayName: 'Frank (Predictor)',
            pinHash: defaultPinHash,
          },
        ],
      },
    },
  });

  console.log('✅ Seeded Sample Teams:', [teamAlpha.teamCode, teamBeta.teamCode]);

  // 3. Seed Competition Rounds
  const rounds = [
    {
      roundNumber: 1,
      title: 'Round 1 — Speed MCQ Elimination',
      type: RoundType.ROUND1_MCQ,
      timeLimitSec: 900, // 15 mins
    },
    {
      roundNumber: 2,
      title: 'Round 2 — Code Relay',
      type: RoundType.ROUND2_RELAY,
      timeLimitSec: 1800, // 30 mins total (10 mins / stage)
    },
    {
      roundNumber: 3,
      title: 'Round 3 — Bug Hunt & Debugging',
      type: RoundType.ROUND3_BUG_HUNT,
      timeLimitSec: 1200, // 20 mins
    },
    {
      roundNumber: 4,
      title: 'Round 4 — Speed Architecture & Finale',
      type: RoundType.ROUND4_FINALE,
      timeLimitSec: 1500, // 25 mins
    },
  ];

  for (const r of rounds) {
    await prisma.round.upsert({
      where: { roundNumber: r.roundNumber },
      update: {},
      create: {
        roundNumber: r.roundNumber,
        title: r.title,
        type: r.type,
        status: RoundStatus.DRAFT,
        timeLimitSec: r.timeLimitSec,
      },
    });
  }

  console.log('✅ Seeded Competition Rounds 1 - 4.');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
