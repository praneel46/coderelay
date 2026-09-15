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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Round2Service } from './round2.service';
import { Round2StateTransitionDto } from '@coderelay/shared';

@Controller('organizer/round2')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORGANIZER)
export class Round2OrganizerController {
  constructor(private readonly round2Service: Round2Service) {}

  private extractActor(req: any) {
    const user = req.user;
    if (!user || !user.userId) {
      throw new UnauthorizedException('Organizer authentication required.');
    }
    return {
      userId: user.userId as string,
      username: (user.username || 'organizer') as string,
    };
  }

  @Post('transition')
  async transitionState(@Req() req: any, @Body() dto: Round2StateTransitionDto) {
    const { userId, username } = this.extractActor(req);
    return await this.round2Service.transitionState(userId, username, dto);
  }

  @Post('emergency-lock')
  async emergencyLock(@Req() req: any) {
    const { userId, username } = this.extractActor(req);
    return await this.round2Service.emergencyLock(userId, username);
  }

  @Post('score')
  async scoreRound2(@Req() req: any) {
    const { userId, username } = this.extractActor(req);
    return await this.round2Service.scoreRound2(userId, username);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return await this.round2Service.getLeaderboard();
  }
}
