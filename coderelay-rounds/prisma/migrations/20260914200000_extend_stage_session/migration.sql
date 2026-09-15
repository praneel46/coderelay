-- AlterTable
ALTER TABLE "stage_sessions" ALTER COLUMN "participantSessionId" DROP NOT NULL,
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "memberId" TEXT,
ADD COLUMN     "deadlineAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "isFinal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAutoSubmitted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "stage_sessions_teamId_stageId_idx" ON "stage_sessions"("teamId", "stageId");

-- AddForeignKey
ALTER TABLE "stage_sessions" ADD CONSTRAINT "stage_sessions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_sessions" ADD CONSTRAINT "stage_sessions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
