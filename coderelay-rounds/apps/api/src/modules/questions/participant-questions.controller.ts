import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Role } from '@prisma/client';

@Controller('participant/questions')
@Roles(Role.PARTICIPANT, Role.ORGANIZER)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParticipantQuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async getParticipantQuestions(
    @CurrentUser() user: any,
    @Query('roundId') roundId?: string,
    @Query('stageId') stageId?: string,
  ) {
    return this.questionsService.getQuestionsForParticipant(
      user,
      roundId,
      stageId,
    );
  }
}
