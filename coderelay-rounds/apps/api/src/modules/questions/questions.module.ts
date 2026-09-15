import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { ParticipantQuestionsController } from './participant-questions.controller';
import { QuestionsService } from './questions.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [QuestionsController, ParticipantQuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
