import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class ObservabilityModule {}
