import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ResourceType } from '../../database/entities/persistence.enums';
import { MaterialQueryDto } from './material-query.dto';

describe('MaterialQueryDto', () => {
  it.each(['2025-02-30', 'invalid', '2025-01-01T00:00:00Z'])(
    'rejects invalid date %s',
    async (date) => {
      const errors = await validate(
        plainToInstance(MaterialQueryDto, { date }),
      );
      expect(errors.map((error) => error.property)).toContain('date');
    },
  );

  it('accepts the explicit rank contract and an exact UTC date', async () => {
    await expect(
      validate(
        plainToInstance(MaterialQueryDto, {
          sort: 'recommended',
          date: '2025-01-01',
        }),
      ),
    ).resolves.toEqual([]);
    const errors = await validate(
      plainToInstance(MaterialQueryDto, { sort: 'random' }),
    );
    expect(errors.map((error) => error.property)).toContain('sort');
  });
  it('accepts scalar and repeated terms plus date sorts', async () => {
    const scalar = plainToInstance(MaterialQueryDto, {
      term: ' Slurm ',
      sort: 'date_desc',
    });
    const repeated = plainToInstance(MaterialQueryDto, {
      term: ['Slurm', 'GPU'],
      sort: 'date_asc',
    });

    await expect(validate(scalar)).resolves.toEqual([]);
    await expect(validate(repeated)).resolves.toEqual([]);
    expect(scalar.term).toEqual([' Slurm ']);
    expect(repeated.term).toEqual(['Slurm', 'GPU']);
  });
  it('transforms accepted pagination and resource-type query values', async () => {
    const query = plainToInstance(MaterialQueryDto, {
      search: 'slurm',
      page: '2',
      pageSize: '10',
      resourceType: 'video',
    });

    await expect(validate(query)).resolves.toEqual([]);
    expect(query).toMatchObject({
      search: 'slurm',
      page: 2,
      pageSize: 10,
      resourceType: ResourceType.VIDEO,
    });
  });

  it('rejects invalid pagination and resource-type values', async () => {
    const query = plainToInstance(MaterialQueryDto, {
      page: '0',
      pageSize: '101',
      resourceType: 'book',
    });

    const errors = await validate(query);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['page', 'pageSize', 'resourceType']),
    );
  });
});
