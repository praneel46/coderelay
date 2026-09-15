import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JudgeService } from './judge.service';
import { EvaluateTeamDto } from './dto/evaluate-team.dto';

@Controller('judge')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.JUDGE, Role.ORGANIZER)
export class JudgeController {
  constructor(private readonly judgeService: JudgeService) {}

  @Get('rounds')
  async getRounds() {
    return await this.judgeService.getRounds();
  }

  @Get('rounds/:roundNumber/teams')
  async getTeamsForRound(@Param('roundNumber', ParseIntPipe) roundNumber: number) {
    return await this.judgeService.getTeamsForRound(roundNumber);
  }

  @Post('rounds/:roundNumber/evaluate')
  async evaluateTeam(
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
    @Body() dto: EvaluateTeamDto,
    @Req() req: any,
  ) {
    const judgeUser = {
      id: req.user?.id || req.user?.sub,
      username: req.user?.username || 'judge',
      role: req.user?.role || Role.JUDGE,
    };
    return await this.judgeService.evaluateTeam(roundNumber, dto, judgeUser);
  }
}
