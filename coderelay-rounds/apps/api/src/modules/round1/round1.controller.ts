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
import { Round1Service } from './round1.service';
import { SaveAnswerDto, SubmitRound1Dto } from '@coderelay/shared';

@Controller('round1')
@UseGuards(JwtAuthGuard)
export class Round1Controller {
  constructor(private readonly round1Service: Round1Service) {}

  private extractIdentity(req: any) {
    const user = req.user;
    if (!user || !user.teamId || !user.memberId) {
      throw new UnauthorizedException('Authenticated participant team identity required.');
    }
    return {
      teamId: user.teamId as string,
      memberId: user.memberId as string,
      memberOrder: user.memberOrder as number,
    };
  }

  @Get('state')
  async getRoundState(@Req() req: any) {
    const { teamId, memberId } = this.extractIdentity(req);
    await this.round1Service.ensureTeamRepresentative(teamId, memberId);
    return await this.round1Service.getRound1State();
  }

  @Get('questions')
  async getQuestions(@Req() req: any) {
    const { teamId, memberId } = this.extractIdentity(req);
    return await this.round1Service.getParticipantQuestions(teamId, memberId);
  }

  @Get('answers')
  async getAnswers(@Req() req: any) {
    const { teamId, memberId } = this.extractIdentity(req);
    return await this.round1Service.getSavedAnswers(teamId, memberId);
  }

  @Post('answers')
  async saveAnswer(@Req() req: any, @Body() dto: SaveAnswerDto) {
    const { teamId, memberId } = this.extractIdentity(req);
    return await this.round1Service.saveAnswer(teamId, memberId, dto);
  }

  @Post('submit')
  async submitRound(@Req() req: any, @Body() dto: SubmitRound1Dto) {
    const { teamId, memberId } = this.extractIdentity(req);
    return await this.round1Service.submitRound1(teamId, memberId, dto);
  }
}
