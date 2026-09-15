import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { CompetitionModule } from '../competition/competition.module';
import { Round2Service } from './round2.service';
import { Round2Controller } from './round2.controller';
import { Round2OrganizerController } from './round2-organizer.controller';

@Module({
  imports: [PrismaModule, AuditModule, CompetitionModule],
  providers: [Round2Service],
  controllers: [Round2Controller, Round2OrganizerController],
  exports: [Round2Service],
})
export class Round2Module {}
