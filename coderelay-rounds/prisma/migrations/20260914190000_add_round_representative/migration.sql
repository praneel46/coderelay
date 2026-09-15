-- CreateTable
CREATE TABLE "round_representatives" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "round_representatives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "round_representatives_roundId_teamId_key" ON "round_representatives"("roundId", "teamId");

-- AddForeignKey
ALTER TABLE "round_representatives" ADD CONSTRAINT "round_representatives_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_representatives" ADD CONSTRAINT "round_representatives_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_representatives" ADD CONSTRAINT "round_representatives_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
