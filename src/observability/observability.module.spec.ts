import { HealthController } from './health.controller';
import { ObservabilityModule } from './observability.module';
import { TelemetryService } from './telemetry.service';

describe('ObservabilityModule', () => {
  it('registers the telemetry service with Nest dependency injection', () => {
    const providers: unknown = Reflect.getMetadata(
      'providers',
      ObservabilityModule,
    );

    expect(providers).toContain(TelemetryService);
  });

  it('registers the health controller', () => {
    const controllers: unknown = Reflect.getMetadata(
      'controllers',
      ObservabilityModule,
    );

    expect(controllers).toContain(HealthController);
  });

  it('returns an empty list until telemetry behavior is implemented', () => {
    expect(new TelemetryService().findAll()).toEqual([]);
  });
});
