import { Module } from '@nestjs/common';
import { JudgeController } from './judge.controller';
import { JudgeService } from './judge.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { CompetitionModule } from '../competition/competition.module';

@Module({
  imports: [PrismaModule, AuditModule, CompetitionModule],
  controllers: [JudgeController],
  providers: [JudgeService],
  exports: [JudgeService],
})
export class JudgeModule {}
