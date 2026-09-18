import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  controllers: [HealthController],
  providers: [TelemetryService],
  imports: [TerminusModule],
  exports: [TelemetryService],
})
export class ObservabilityModule {}
