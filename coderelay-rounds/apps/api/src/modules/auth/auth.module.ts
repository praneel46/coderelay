import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        if (
          isProduction &&
          (!jwtSecret || jwtSecret === 'dev-secret-key-change-in-production')
        ) {
          throw new Error(
            '❌ FATAL CONFIGURATION ERROR: JWT_SECRET environment variable must be explicitly defined in production mode.',
          );
        }
        return {
          secret: jwtSecret || 'dev-secret-key-change-in-production',
          signOptions: {
            expiresIn: '12h',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
