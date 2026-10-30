import { BadRequestException } from '@nestjs/common';
import { TrainingLibraryService } from './training-library.service';
import { TrainingLibraryRepository } from './persistence/training-library.repository';

describe('TrainingLibraryService query normalization', () => {
  const findMaterials = jest.fn();
  const service = new TrainingLibraryService({
    findMaterials,
  } as unknown as TrainingLibraryRepository);

  beforeEach(() => {
    findMaterials.mockResolvedValue({ items: [], total: 0 });
  });

  it('normalizes, deduplicates, and forwards repeated phrase terms', async () => {
    await service.findMaterials({
      term: [' Slurm   GPU ', 'slurm gpu', '', 'Queue'],
      sort: 'date_asc',
    });

    expect(findMaterials).toHaveBeenCalledWith(
      expect.objectContaining({
        terms: ['Slurm GPU', 'Queue'],
        sort: 'date_asc',
        page: 1,
        pageSize: 10,
      }),
    );
  });

  it('rejects an ambiguous legacy search and phrase-term request', async () => {
    await expect(
      service.findMaterials({ search: 'slurm', term: ['queue'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    ['more than ten phrases', Array.from({ length: 11 }, (_, index) => `t${index}`)],
    ['a phrase longer than 100 characters', ['x'.repeat(101)]],
  ])('rejects %s', async (_, term) => {
    await expect(service.findMaterials({ term })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
