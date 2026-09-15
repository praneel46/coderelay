import { Controller, Post, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { RoundControlService } from './round-control.service';

@Controller('organizer/rounds')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORGANIZER')
export class RoundControlController {
  constructor(private readonly roundControlService: RoundControlService) {}

  @Post(':roundNumber/load')
  async loadRound(
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @CurrentUser() user: any,
  ) {
    return this.roundControlService.loadRound(roundNumber, user);
  }

  @Post(':roundNumber/start')
  async startTimer(
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @CurrentUser() user: any,
  ) {
    return this.roundControlService.startTimer(roundNumber, user);
  }

  @Post(':roundNumber/pause')
  async pauseRound(
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @CurrentUser() user: any,
  ) {
    return this.roundControlService.pauseRound(roundNumber, user);
  }

  @Post(':roundNumber/resume')
  async resumeRound(
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @CurrentUser() user: any,
  ) {
    return this.roundControlService.resumeRound(roundNumber, user);
  }

  @Post(':roundNumber/end')
  async endRound(
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @CurrentUser() user: any,
  ) {
    return this.roundControlService.endRound(roundNumber, user);
  }

  @Post(':roundNumber/reset')
  async resetRound(
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @Body('confirmationCode') confirmationCode: string,
    @CurrentUser() user: any,
  ) {
    return this.roundControlService.resetRound(roundNumber, confirmationCode, user);
  }
}
