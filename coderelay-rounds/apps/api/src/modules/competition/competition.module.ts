import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CompetitionGateway } from './competition.gateway';
import { RoundControlService } from './round-control.service';
import { RoundControlController } from './round-control.controller';

@Module({
  imports: [PrismaModule, AuthModule, ConfigModule],
  controllers: [RoundControlController],
  providers: [CompetitionGateway, RoundControlService],
  exports: [CompetitionGateway, RoundControlService],
})
export class CompetitionModule {}
