import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Round2Service } from './round2.service';
import {
  SaveRound2AnswerDto,
  SubmitRound2StageDto,
  ReportSecurityEventDto,
} from '@coderelay/shared';

@Controller('round2')
@UseGuards(JwtAuthGuard)
export class Round2Controller {
  constructor(private readonly round2Service: Round2Service) {}

  private extractParticipantIdentity(req: any) {
    const user = req.user;
    if (!user || !user.teamId || !user.memberId) {
      throw new UnauthorizedException('Authenticated participant identity required.');
    }
    return {
      teamId: user.teamId as string,
      memberId: user.memberId as string,
    };
  }

  @Get('state')
  async getParticipantState(@Req() req: any) {
    const { teamId, memberId } = this.extractParticipantIdentity(req);
    return await this.round2Service.getParticipantState(teamId, memberId);
  }

  @Get('questions')
  async getParticipantQuestions(@Req() req: any) {
    const { teamId, memberId } = this.extractParticipantIdentity(req);
    return await this.round2Service.getParticipantQuestions(teamId, memberId);
  }

  @Get('answers')
  async getSavedAnswers(@Req() req: any) {
    const { teamId, memberId } = this.extractParticipantIdentity(req);
    return await this.round2Service.getSavedAnswers(teamId, memberId);
  }

  @Post('answers')
  async saveAnswer(@Req() req: any, @Body() dto: SaveRound2AnswerDto) {
    const { teamId, memberId } = this.extractParticipantIdentity(req);
    return await this.round2Service.saveAnswer(teamId, memberId, dto);
  }

  @Post('submit-stage')
  async submitStage(@Req() req: any, @Body() dto: SubmitRound2StageDto) {
    const { teamId, memberId } = this.extractParticipantIdentity(req);
    return await this.round2Service.submitStage(teamId, memberId, dto);
  }

  @Post('security-violation')
  async reportSecurityEvent(@Req() req: any, @Body() dto: ReportSecurityEventDto) {
    const { teamId, memberId } = this.extractParticipantIdentity(req);
    return await this.round2Service.reportSecurityEvent(teamId, memberId, dto);
  }
}
