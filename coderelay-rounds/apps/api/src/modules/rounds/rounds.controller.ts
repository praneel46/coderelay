import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RoundsService, UpdateRoundDto } from './rounds.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Role } from '@prisma/client';

@Controller('organizer/rounds')
@Roles(Role.ORGANIZER)
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get()
  async getAllRounds() {
    return this.roundsService.getAllRounds();
  }

  @Get(':id')
  async getRoundById(@Param('id') id: string) {
    return this.roundsService.getRoundById(id);
  }

  @Patch(':id')
  async updateRound(
    @Param('id') id: string,
    @Body() dto: UpdateRoundDto,
    @CurrentUser() user: any,
  ) {
    return this.roundsService.updateRound(id, dto, user.username);
  }
}
