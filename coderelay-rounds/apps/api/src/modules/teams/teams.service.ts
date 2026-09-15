import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export interface CreateTeamDto {
  teamCode: string;
  name: string;
  college?: string;
  members: Array<{
    memberOrder: number;
    displayName: string;
    pin: string;
  }>;
}

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getAllTeams() {
    return this.prisma.team.findMany({
      include: {
        members: {
          select: {
            id: true,
            memberOrder: true,
            displayName: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { memberOrder: 'asc' },
        },
        _count: {
          select: { sessions: true, submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeamById(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            memberOrder: true,
            displayName: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { memberOrder: 'asc' },
        },
        sessions: {
          select: {
            id: true,
            memberId: true,
            role: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  async createTeam(dto: CreateTeamDto, actorUsername: string) {
    const formattedCode = dto.teamCode.trim().toUpperCase();

    // 1. Enforce exactly 3 team members
    if (!dto.members || dto.members.length !== 3) {
      throw new BadRequestException('Team creation requires exactly 3 team members');
    }

    // 2. Enforce explicit member orders 1, 2, 3 with no duplicates
    const orders = dto.members.map((m) => m.memberOrder).sort((a, b) => a - b);
    if (orders[0] !== 1 || orders[1] !== 2 || orders[2] !== 3) {
      throw new BadRequestException(
        'Team members must have explicit member orders 1, 2, and 3 without duplicates',
      );
    }

    // 3. Validate PIN format (4 digits)
    for (const m of dto.members) {
      if (!m.pin || !/^\d{4}$/.test(m.pin.trim())) {
        throw new BadRequestException(
          `Member ${m.memberOrder} PIN must be a 4-digit numeric code`,
        );
      }
    }

    const existing = await this.prisma.team.findUnique({
      where: { teamCode: formattedCode },
    });

    if (existing) {
      throw new ConflictException(`Team code "${formattedCode}" already exists`);
    }

    const memberCreates = await Promise.all(
      dto.members.map(async (m) => {
        const pinHash = await bcrypt.hash(m.pin.trim(), 10);
        return {
          memberOrder: m.memberOrder,
          displayName: m.displayName.trim(),
          pinHash,
        };
      }),
    );

    const team = await this.prisma.team.create({
      data: {
        teamCode: formattedCode,
        name: dto.name,
        members: {
          create: memberCreates,
        },
      },
      include: {
        members: {
          select: {
            id: true,
            memberOrder: true,
            displayName: true,
            isActive: true,
          },
        },
      },
    });

    await this.auditService.logAction({
      actorUsername,
      actorRole: Role.ORGANIZER,
      action: 'CREATE_TEAM',
      resource: 'Team',
      resourceId: team.id,
      metadata: { teamCode: team.teamCode, name: team.name },
    });

    this.logger.log(`Organizer ${actorUsername} created team ${team.teamCode}`);

    return team;
  }
}
