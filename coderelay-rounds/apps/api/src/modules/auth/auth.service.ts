import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ParticipantLoginDto } from './dto/participant-login.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  // Hash PINs, Passwords, or Access Codes securely using bcrypt (salt rounds = 10)
  async hashSecret(plainSecret: string): Promise<string> {
    return bcrypt.hash(plainSecret, 10);
  }

  // Verify PIN, Password, or Access Code match
  async verifySecret(plainSecret: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainSecret, hash);
  }

  // Participant Login (Team Code + Access Code / PIN)
  async loginParticipant(dto: ParticipantLoginDto) {
    const formattedCode = dto.teamCode.trim().toUpperCase();
    const secret = (dto.accessCode || dto.pin || '').trim();

    if (!secret) {
      throw new UnauthorizedException('Access code or PIN is required');
    }

    // 1. Find team
    const team = await this.prisma.team.findUnique({
      where: { teamCode: formattedCode },
      include: { members: { orderBy: { memberOrder: 'asc' } } },
    });

    if (!team || !team.isActive) {
      this.logger.warn(`Failed participant login: invalid team code "${formattedCode}"`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (dto.memberOrder && !team.members.some((m) => m.memberOrder === dto.memberOrder)) {
      this.logger.warn(`Failed participant login: invalid memberOrder ${dto.memberOrder}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    let isSecretValid = false;
    let targetMemberOrder = dto.memberOrder || 1;

    // A. If team has accessCodeHash, check against team accessCodeHash
    if (team.accessCodeHash) {
      isSecretValid = await this.verifySecret(secret, team.accessCodeHash);
    }

    // B. Fallback: Check member PIN hash (supports memberOrder or first member)
    if (!isSecretValid && team.members.length > 0) {
      const targetMember = team.members.find((m) => m.memberOrder === targetMemberOrder) || team.members[0];
      if (targetMember && targetMember.isActive) {
        const pinMatch = await this.verifySecret(secret, targetMember.pinHash);
        if (pinMatch) {
          isSecretValid = true;
          targetMemberOrder = targetMember.memberOrder;
        }
      }
    }

    if (!isSecretValid) {
      this.logger.warn(`Failed participant login: team "${formattedCode}" access code mismatch`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const member = team.members.find((m) => m.memberOrder === targetMemberOrder) || team.members[0];

    // Expiration: 12 hours from now
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    // Generate JWT token payload
    const payload = {
      sub: member ? member.id : team.id,
      teamId: team.id,
      teamCode: team.teamCode,
      memberOrder: member ? member.memberOrder : 1,
      role: Role.PARTICIPANT,
    };

    const token = this.jwtService.sign(payload);

    // Create ParticipantSession record in DB
    const session = await this.prisma.participantSession.create({
      data: {
        token,
        teamId: team.id,
        memberId: member ? member.id : team.id,
        role: Role.PARTICIPANT,
        expiresAt,
      },
    });

    this.logger.log(`Participant authenticated: Team ${team.teamCode} (${team.name})`);

    return {
      accessToken: token,
      user: {
        userId: member ? member.id : team.id,
        role: Role.PARTICIPANT,
        teamId: team.id,
        teamCode: team.teamCode,
        teamName: team.name,
        memberId: member ? member.id : null,
        memberOrder: member ? member.memberOrder : 1,
        displayName: member ? member.displayName : team.name,
        sessionId: session.id,
      },
    };
  }

  // Dedicated Host Access Code Authentication
  async loginHost(hostCode: string) {
    const formattedCode = (hostCode || '').trim();
    if (!formattedCode) {
      throw new UnauthorizedException('Host Access Code is required');
    }

    // Find host user record
    let hostUser = await this.prisma.user.findFirst({
      where: { role: Role.HOST },
    });

    if (!hostUser) {
      // Seed default host user with default code "HOST-2026"
      const defaultHash = await this.hashSecret('HOST-2026');
      hostUser = await this.prisma.user.create({
        data: {
          username: 'host',
          passwordHash: defaultHash,
          role: Role.HOST,
          displayName: 'Host Auditorium Display',
        },
      });
    }

    const isValid = await this.verifySecret(formattedCode, hostUser.passwordHash);
    if (!isValid) {
      this.logger.warn('Failed Host login attempt: invalid host access code');
      throw new UnauthorizedException('Invalid Host Access Code');
    }

    const payload = {
      sub: hostUser.id,
      username: hostUser.username,
      role: Role.HOST,
    };

    const token = this.jwtService.sign(payload);

    await this.auditService.logAction({
      actorId: hostUser.id,
      actorUsername: hostUser.username,
      actorRole: Role.HOST,
      action: 'HOST_LOGIN',
      resource: 'HostDisplay',
    });

    return {
      accessToken: token,
      user: {
        userId: hostUser.id,
        username: hostUser.username,
        role: Role.HOST,
        displayName: hostUser.displayName,
      },
    };
  }

  // Organizer: Regenerate Host Access Code
  async regenerateHostCode(actorUsername: string) {
    const newCode = `HOST-${Math.floor(100000 + Math.random() * 900000)}`;
    const newHash = await this.hashSecret(newCode);

    let hostUser = await this.prisma.user.findFirst({
      where: { role: Role.HOST },
    });

    if (hostUser) {
      await this.prisma.user.update({
        where: { id: hostUser.id },
        data: { passwordHash: newHash },
      });
    } else {
      hostUser = await this.prisma.user.create({
        data: {
          username: 'host',
          passwordHash: newHash,
          role: Role.HOST,
          displayName: 'Host Auditorium Display',
        },
      });
    }

    await this.auditService.logAction({
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'REGENERATE_HOST_CODE',
      resource: 'User',
      resourceId: hostUser.id,
    });

    return {
      success: true,
      hostAccessCode: newCode,
      message: 'Host Access Code updated successfully',
    };
  }

  // Organizer: Get/Regenerate Team Access Codes
  async regenerateTeamAccessCode(teamId: string, actorUsername: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new BadRequestException(`Team ${teamId} not found`);
    }

    const newCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    const newHash = await this.hashSecret(newCode);

    await this.prisma.team.update({
      where: { id: teamId },
      data: { accessCodeHash: newHash },
    });

    await this.auditService.logAction({
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'REGENERATE_TEAM_ACCESS_CODE',
      resource: 'Team',
      resourceId: teamId,
    });

    return {
      success: true,
      teamId: team.id,
      teamCode: team.teamCode,
      accessCode: newCode,
    };
  }

  // Privileged User Login (Organizer / Judge)
  async loginUser(dto: UserLoginDto) {
    const formattedUsername = dto.username.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { username: formattedUsername },
    });

    if (!user || !user.isActive) {
      this.logger.warn(`Failed user login attempt for "${formattedUsername}"`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.verifySecret(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`Failed user login: password mismatch for "${formattedUsername}"`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    await this.auditService.logAction({
      actorId: user.id,
      actorUsername: user.username,
      actorRole: user.role,
      action: 'LOGIN',
      resource: 'Auth',
      metadata: { loginTime: new Date().toISOString() },
    });

    this.logger.log(`Privileged user authenticated: ${user.username} (${user.role})`);

    return {
      accessToken: token,
      user: {
        userId: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
      },
    };
  }

  // Logout session
  async logoutSession(token: string) {
    try {
      await this.prisma.participantSession.deleteMany({
        where: { token },
      });
      return { success: true, message: 'Logged out successfully' };
    } catch {
      return { success: true, message: 'Session closed' };
    }
  }

  // Organizer: Revoke specific participant session
  async revokeParticipantSession(sessionId: string, actorUsername: string) {
    const session = await this.prisma.participantSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    await this.prisma.participantSession.delete({
      where: { id: sessionId },
    });

    await this.auditService.logAction({
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'REVOKE_SESSION',
      resource: 'ParticipantSession',
      resourceId: sessionId,
      metadata: { teamId: session.teamId, memberId: session.memberId },
    });

    return { success: true, message: `Session ${sessionId} revoked` };
  }

  // Organizer: Revoke all active sessions for a team
  async revokeTeamSessions(teamId: string, actorUsername: string) {
    const result = await this.prisma.participantSession.deleteMany({
      where: { teamId },
    });

    await this.auditService.logAction({
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'REVOKE_TEAM_SESSIONS',
      resource: 'Team',
      resourceId: teamId,
      metadata: { revokedCount: result.count },
    });

    return {
      success: true,
      message: `Revoked ${result.count} active session(s) for team ${teamId}`,
    };
  }
}
