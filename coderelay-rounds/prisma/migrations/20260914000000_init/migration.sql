-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARTICIPANT', 'ORGANIZER', 'JUDGE', 'HOST');

-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('ROUND1_MCQ', 'ROUND2_RELAY', 'ROUND3_BUG_HUNT', 'ROUND4_FINALE');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'ACTIVE', 'HANDOFF', 'COMPLETED', 'TIMED_OUT');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'DEBUGGING', 'CODING', 'PREDICT_OUTPUT');

-- CreateEnum
CREATE TYPE "SnapshotType" AS ENUM ('AUTOSAVE', 'HANDOFF', 'SUBMISSION', 'FINAL_LOCK');

-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('TAB_SWITCH', 'WINDOW_BLUR', 'COPY_PASTE', 'DEV_TOOLS', 'UNAUTHORIZED_API');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "teamCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "memberOrder" INTEGER NOT NULL,
    "pinHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARTICIPANT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "type" "RoundType" NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'DRAFT',
    "timeLimitSec" INTEGER NOT NULL DEFAULT 900,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "round_stages" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "assignedRole" TEXT NOT NULL,
    "timeLimitSec" INTEGER NOT NULL DEFAULT 600,

    CONSTRAINT "round_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_sessions" (
    "id" TEXT NOT NULL,
    "participantSessionId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "codeSnapshot" TEXT,
    "warningCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stage_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arena_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "arena_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "stageId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "initialCode" TEXT,
    "testCases" JSONB,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "stageId" TEXT,
    "memberId" TEXT,
    "questionId" TEXT,
    "answerText" TEXT,
    "codeContent" TEXT,
    "isAutoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "score" DOUBLE PRECISION,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relay_snapshots" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "stageId" TEXT,
    "memberId" TEXT NOT NULL,
    "memberOrder" INTEGER NOT NULL,
    "codeContent" TEXT NOT NULL,
    "snapshotType" "SnapshotType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relay_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "memberId" TEXT,
    "stageId" TEXT,
    "violationType" "ViolationType" NOT NULL,
    "warningNumber" INTEGER NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorUsername" TEXT NOT NULL,
    "actorRole" "Role" NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "teams_teamCode_key" ON "teams"("teamCode");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_memberOrder_key" ON "team_members"("teamId", "memberOrder");

-- CreateIndex
CREATE UNIQUE INDEX "participant_sessions_token_key" ON "participant_sessions"("token");

-- CreateIndex
CREATE INDEX "participant_sessions_teamId_memberId_idx" ON "participant_sessions"("teamId", "memberId");

-- CreateIndex
CREATE INDEX "participant_sessions_token_idx" ON "participant_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "rounds_roundNumber_key" ON "rounds"("roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rounds_slug_key" ON "rounds"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "round_stages_roundId_stageOrder_key" ON "round_stages"("roundId", "stageOrder");

-- CreateIndex
CREATE INDEX "stage_sessions_participantSessionId_stageId_idx" ON "stage_sessions"("participantSessionId", "stageId");

-- CreateIndex
CREATE UNIQUE INDEX "arena_codes_code_key" ON "arena_codes"("code");

-- CreateIndex
CREATE INDEX "questions_roundId_stageId_idx" ON "questions"("roundId", "stageId");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_questionId_label_key" ON "question_options"("questionId", "label");

-- CreateIndex
CREATE INDEX "submissions_teamId_roundId_idx" ON "submissions"("teamId", "roundId");

-- CreateIndex
CREATE INDEX "submissions_questionId_idx" ON "submissions"("questionId");

-- CreateIndex
CREATE INDEX "relay_snapshots_teamId_roundId_idx" ON "relay_snapshots"("teamId", "roundId");

-- CreateIndex
CREATE INDEX "relay_snapshots_teamId_snapshotType_idx" ON "relay_snapshots"("teamId", "snapshotType");

-- CreateIndex
CREATE INDEX "security_events_teamId_createdAt_idx" ON "security_events"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_sessions" ADD CONSTRAINT "participant_sessions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_sessions" ADD CONSTRAINT "participant_sessions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_stages" ADD CONSTRAINT "round_stages_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_sessions" ADD CONSTRAINT "stage_sessions_participantSessionId_fkey" FOREIGN KEY ("participantSessionId") REFERENCES "participant_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_sessions" ADD CONSTRAINT "stage_sessions_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "round_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_codes" ADD CONSTRAINT "arena_codes_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "round_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "round_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_snapshots" ADD CONSTRAINT "relay_snapshots_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_snapshots" ADD CONSTRAINT "relay_snapshots_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_snapshots" ADD CONSTRAINT "relay_snapshots_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "round_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_snapshots" ADD CONSTRAINT "relay_snapshots_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "round_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
