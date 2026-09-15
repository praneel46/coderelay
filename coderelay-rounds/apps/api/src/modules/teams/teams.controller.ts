import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeamsService, CreateTeamDto } from './teams.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Role } from '@prisma/client';

@Controller('organizer/teams')
@Roles(Role.ORGANIZER)
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  async getAllTeams() {
    return this.teamsService.getAllTeams();
  }

  @Get(':id')
  async getTeamById(@Param('id') id: string) {
    return this.teamsService.getTeamById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTeam(
    @Body() dto: CreateTeamDto,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.createTeam(dto, user.username);
  }
}
