import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a successful lightweight health response', () => {
    expect(new HealthController().getHealthInfo()).toEqual({ status: 'ok' });
  });
});
