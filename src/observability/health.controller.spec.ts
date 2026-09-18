jest.mock('@nestjs/terminus', () => ({
  HealthCheckService: class HealthCheckService {},
  TypeOrmHealthIndicator: class TypeOrmHealthIndicator {},
}));

import type {
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const postgresAttempt = {
    withTimeout: jest.fn(),
  };
  const database = {
    pingCheck: jest.fn(),
  };
  const health = {
    check: jest.fn(),
  };
  const controller = new HealthController(
    health as unknown as HealthCheckService,
    database as unknown as TypeOrmHealthIndicator,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('reports that PostgreSQL is healthy', async () => {
    const postgresResult = { postgres: { status: 'up' } };
    postgresAttempt.withTimeout.mockResolvedValue(postgresResult);
    database.pingCheck.mockReturnValue(postgresAttempt);
    health.check.mockImplementation(
      async (checks: Array<() => Promise<unknown>>) => {
        await checks[0]!();
        return {
          status: 'ok',
          details: postgresResult,
        };
      },
    );

    const result = await controller.getHealthInfo();

    expect(database.pingCheck).toHaveBeenCalledWith('postgres');
    expect(postgresAttempt.withTimeout).toHaveBeenCalledWith(1500);
    expect(result.healthy).toBe(true);
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.services).toEqual({ postgres: 'up' });
  });

  it('propagates a failed Terminus health check', async () => {
    const failure = new Error('PostgreSQL is unavailable');
    health.check.mockRejectedValue(failure);

    await expect(controller.getHealthInfo()).rejects.toBe(failure);
  });

  it('maps a non-ok Terminus status to an unhealthy response', async () => {
    health.check.mockResolvedValue({
      status: 'degraded',
      details: { postgres: { status: 'down' } },
    });

    const result = await controller.getHealthInfo();

    expect(result.healthy).toBe(false);
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.services).toEqual({ postgres: 'down' });
  });
});
