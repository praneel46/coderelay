import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ParticipantLoginDto } from './dto/participant-login.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Role } from '@prisma/client';

export class HostLoginDto {
  hostCode!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Participant Login (Team ID + Access Code)
  @Post('participant/login')
  @HttpCode(HttpStatus.OK)
  async loginParticipant(@Body() dto: ParticipantLoginDto) {
    return this.authService.loginParticipant(dto);
  }

  // Dedicated Host Access Code Login
  @Post('host/login')
  @HttpCode(HttpStatus.OK)
  async loginHost(@Body() body: HostLoginDto) {
    return this.authService.loginHost(body.hostCode);
  }

  // Console User Login (Organizer / Judge)
  @Post('user/login')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Body() dto: UserLoginDto) {
    return this.authService.loginUser(dto);
  }

  // Get current authenticated user session context
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return {
      success: true,
      user,
    };
  }

  // Logout session
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Headers('authorization') authHeader: string) {
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : '';
    return this.authService.logoutSession(token);
  }

  // Organizer: Regenerate Host Access Code
  @Post('organizer/host-code/regenerate')
  @Roles(Role.ORGANIZER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async regenerateHostCode(@CurrentUser() user: any) {
    return this.authService.regenerateHostCode(user.username);
  }

  // Organizer: Regenerate Access Code for a Team
  @Post('organizer/team-code/regenerate/:teamId')
  @Roles(Role.ORGANIZER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async regenerateTeamAccessCode(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    return this.authService.regenerateTeamAccessCode(teamId, user.username);
  }

  // Organizer: Revoke specific participant session
  @Post('sessions/revoke/:sessionId')
  @Roles(Role.ORGANIZER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    return this.authService.revokeParticipantSession(sessionId, user.username);
  }

  // Organizer: Revoke all active sessions for a team
  @Post('teams/revoke/:teamId')
  @Roles(Role.ORGANIZER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async revokeTeam(
    @Param('teamId') teamId: string,
    @CurrentUser() user: any,
  ) {
    return this.authService.revokeTeamSessions(teamId, user.username);
  }
}
