import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
  ) {}

  @Get('health')
  async getHealthInfo() {
    const result = await this.health.check([
      () => this.database.pingCheck('postgres').withTimeout(1500),
    ]);

    return {
      healthy: result.status === 'ok',
      timestamp: new Date(),
      services: {
        postgres: result.details.postgres.status,
      },
    };
  }
}
