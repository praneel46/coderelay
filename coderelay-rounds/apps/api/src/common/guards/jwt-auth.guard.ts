import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication credentials missing');
    }

    const token = authHeader.substring(7);

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'dev-secret-key-change-in-production';
      const isProduction =
        this.configService.get<string>('NODE_ENV') === 'production';
      if (isProduction && secret === 'dev-secret-key-change-in-production') {
        throw new UnauthorizedException(
          'Authentication misconfigured: missing JWT_SECRET',
        );
      }
      const payload = this.jwtService.verify(token, { secret });

      // Verify participant session or user session
      if (payload.role === 'PARTICIPANT') {
        const session = await this.prisma.participantSession.findUnique({
          where: { token },
          include: { team: true, member: true },
        });

        if (!session || session.expiresAt < new Date()) {
          throw new UnauthorizedException('Participant session expired or invalid');
        }

        request.user = {
          userId: session.memberId,
          role: session.role,
          teamId: session.teamId,
          teamCode: session.team.teamCode,
          teamName: session.team.name,
          memberId: session.memberId,
          memberOrder: session.member.memberOrder,
          displayName: session.member.displayName,
          sessionId: session.id,
        };
      } else {
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
        });

        if (!user || !user.isActive) {
          throw new UnauthorizedException('User account inactive or invalid');
        }

        request.user = {
          userId: user.id,
          username: user.username,
          role: user.role,
          displayName: user.displayName,
        };
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
