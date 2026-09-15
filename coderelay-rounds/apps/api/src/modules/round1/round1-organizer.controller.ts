import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Round1Service } from './round1.service';
import { Round1StateTransitionDto } from '@coderelay/shared';

@Controller('organizer/round1')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORGANIZER)
export class Round1OrganizerController {
  constructor(private readonly round1Service: Round1Service) {}

  @Post('transition')
  async transitionState(@Req() req: any, @Body() dto: Round1StateTransitionDto) {
    const actorId = req.user.userId || req.user.id || 'organizer-id';
    const actorUsername = req.user.username || 'organizer';
    return await this.round1Service.transitionState(actorId, actorUsername, dto);
  }

  @Post('score')
  async scoreRound(@Req() req: any) {
    const actorId = req.user.userId || req.user.id || 'organizer-id';
    const actorUsername = req.user.username || 'organizer';
    return await this.round1Service.scoreRound1(actorId, actorUsername);
  }

  @Post('qualify')
  async qualifyRound(@Req() req: any) {
    const actorId = req.user.userId || req.user.id || 'organizer-id';
    const actorUsername = req.user.username || 'organizer';
    return await this.round1Service.qualifyRound1(actorId, actorUsername);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return await this.round1Service.getLeaderboard();
  }

  @Post('emergency-lock')
  async emergencyLock(@Req() req: any) {
    const actorId = req.user.userId || req.user.id || 'organizer-id';
    const actorUsername = req.user.username || 'organizer';
    return await this.round1Service.emergencyLock(actorId, actorUsername);
  }
}
