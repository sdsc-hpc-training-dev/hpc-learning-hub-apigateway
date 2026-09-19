import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ResourceType } from '../../database/entities/persistence.enums';
import { MaterialQueryDto } from './material-query.dto';

describe('MaterialQueryDto', () => {
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
