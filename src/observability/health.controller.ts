import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller()
export class HealthController {
  constructor() {}

  @Get('health')
  @HttpCode(200)
  getHealthInfo() {
    return { status: 'ok' };
  }
}
