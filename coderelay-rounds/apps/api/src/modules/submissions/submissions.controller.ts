import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('organizer/submissions')
@Roles(Role.ORGANIZER)
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get()
  async getSubmissions(
    @Query('roundId') roundId?: string,
    @Query('teamId') teamId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.submissionsService.getAllSubmissions({
      roundId,
      teamId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }
}
