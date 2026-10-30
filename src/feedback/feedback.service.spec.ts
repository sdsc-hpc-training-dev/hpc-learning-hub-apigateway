import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  const query = jest.fn<Promise<unknown>, [string, unknown[]]>();
  let service: FeedbackService;

  beforeEach(() => {
    query.mockReset().mockResolvedValue(undefined);
    service = new FeedbackService({ query } as never);
  });

  it('writes one normalized row using INSERT only', async () => {
    await service.create({
      rating: 5,
      foundWhatNeeded: 'yes',
      workedWell: 'Useful examples',
      improvements: '   ',
    });

    expect(query).toHaveBeenCalledTimes(1);
    const [statement, values] = query.mock.calls[0]!;
    expect(statement).toMatch(/^INSERT INTO site_feedback/m);
    expect(statement).not.toMatch(/\b(SELECT|RETURNING)\b/i);
    expect(values).toEqual(
      expect.arrayContaining([1, 5, 'yes', 'Useful examples', null]),
    );
  });

  it('enforces the UTF-16 input limit before an insert', async () => {
    await expect(
      service.create({ rating: 1, workedWell: 'x'.repeat(501) }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('uses one process-wide counter rather than client identity', async () => {
    for (let index = 0; index < 60; index += 1) {
      await service.create({ rating: 3 });
    }
    await expect(service.create({ rating: 3 })).rejects.toBeInstanceOf(
      HttpException,
    );
    try {
      await service.create({ rating: 3 });
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });
});
