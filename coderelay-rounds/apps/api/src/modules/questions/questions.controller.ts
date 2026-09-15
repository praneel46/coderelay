import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  QuestionsService,
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionFilterDto,
} from './questions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Role } from '@prisma/client';

@Controller('organizer/questions')
@Roles(Role.ORGANIZER)
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async getQuestions(@Query() filter: QuestionFilterDto) {
    return this.questionsService.getQuestionsForOrganizer(filter);
  }

  @Get(':id')
  async getQuestionById(@Param('id') id: string) {
    return this.questionsService.getQuestionByIdForOrganizer(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createQuestion(
    @Body() dto: CreateQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.questionsService.createQuestion(dto, user.username);
  }

  @Put(':id')
  async updateQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.questionsService.updateQuestion(id, dto, user.username);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publishQuestion(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.questionsService.publishQuestion(id, user.username);
  }

  @Post(':id/lock')
  @HttpCode(HttpStatus.OK)
  async lockQuestion(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.questionsService.lockQuestion(id, user.username);
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  async duplicateQuestion(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.questionsService.duplicateQuestion(id, user.username);
  }
}
