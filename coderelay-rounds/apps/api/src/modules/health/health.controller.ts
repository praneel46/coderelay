import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      service: 'VIDYANTRA 2026 Code Relay API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      serverAuthority: true,
    };
  }
}
