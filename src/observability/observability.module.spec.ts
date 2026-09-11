import { Test, TestingModule } from '@nestjs/testing';
import { ObservabilityModule } from './observability.module';
import { TelemetryService } from './telemetry.service';

describe('ObservabilityModule', () => {
  let service: TelemetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ObservabilityModule],
    }).compile();

    service = module.get(TelemetryService);
  });

  it('registers the telemetry service with Nest dependency injection', () => {
    expect(service).toBeInstanceOf(TelemetryService);
  });

  it('returns an empty list until telemetry behavior is implemented', () => {
    expect(service.findAll()).toEqual([]);
  });
});
