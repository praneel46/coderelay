import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { CompetitionModule } from '../competition/competition.module';
import { Round1Service } from './round1.service';
import { Round1Controller } from './round1.controller';
import { Round1OrganizerController } from './round1-organizer.controller';

@Module({
  imports: [PrismaModule, AuditModule, CompetitionModule],
  controllers: [Round1Controller, Round1OrganizerController],
  providers: [Round1Service],
  exports: [Round1Service],
})
export class Round1Module {}
