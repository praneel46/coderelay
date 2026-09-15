import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { CompetitionModule } from './modules/competition/competition.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { TeamsModule } from './modules/teams/teams.module';
import { RoundsModule } from './modules/rounds/rounds.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { Round1Module } from './modules/round1/round1.module';
import { Round2Module } from './modules/round2/round2.module';
import { JudgeModule } from './modules/judge/judge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    TeamsModule,
    RoundsModule,
    QuestionsModule,
    SubmissionsModule,
    Round1Module,
    Round2Module,
    JudgeModule,
    HealthModule,
    CompetitionModule,
  ],
})
export class AppModule {}
