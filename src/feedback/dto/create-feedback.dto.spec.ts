import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFeedbackDto } from './create-feedback.dto';

describe('CreateFeedbackDto', () => {
  it('accepts the contracted optional fields and nulls', async () => {
    await expect(
      validate(
        plainToInstance(CreateFeedbackDto, {
          rating: 4,
          foundWhatNeeded: 'partly',
          workedWell: null,
          improvements: null,
        }),
      ),
    ).resolves.toEqual([]);
  });

  it.each([
    { rating: 0 },
    { rating: 6 },
    { rating: '5' },
    { rating: 3, foundWhatNeeded: 'maybe' },
  ])('rejects an invalid request %#', async (input) => {
    await expect(
      validate(plainToInstance(CreateFeedbackDto, input)),
    ).resolves.not.toEqual([]);
  });
});
