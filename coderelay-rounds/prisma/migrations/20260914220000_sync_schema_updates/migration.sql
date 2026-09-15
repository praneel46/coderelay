-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'LOCKED');

-- AlterTable
ALTER TABLE "teams" ADD COLUMN "accessCodeHash" TEXT,
ADD COLUMN "isQualifiedR2" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isQualifiedR4" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "rounds" ADD COLUMN "description" TEXT DEFAULT '',
ADD COLUMN "durationSeconds" INTEGER DEFAULT 900,
ADD COLUMN "config" JSONB DEFAULT '{}',
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "endedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "round_stages" ADD COLUMN "title" TEXT DEFAULT '',
ADD COLUMN "durationSeconds" INTEGER DEFAULT 600,
ADD COLUMN "memberOrder" INTEGER;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN "problemStatement" TEXT DEFAULT '',
ADD COLUMN "codeSnippet" TEXT,
ADD COLUMN "language" TEXT DEFAULT 'python',
ADD COLUMN "difficulty" "Difficulty" DEFAULT 'MEDIUM',
ADD COLUMN "marks" INTEGER DEFAULT 10,
ADD COLUMN "status" "QuestionStatus" DEFAULT 'PUBLISHED',
ADD COLUMN "displayOrder" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "participant_sessions" ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
