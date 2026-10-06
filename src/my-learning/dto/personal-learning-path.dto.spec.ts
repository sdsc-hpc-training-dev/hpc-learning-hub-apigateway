import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreatePersonalLearningPathDto } from './create-personal-learning-path.dto';
import { UpdatePersonalLearningPathDto } from './update-personal-learning-path.dto';

const pipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});
const createMetadata = {
  type: 'body' as const,
  metatype: CreatePersonalLearningPathDto,
};
const updateMetadata = {
  type: 'body' as const,
  metatype: UpdatePersonalLearningPathDto,
};

it('trims titles and allows creation with no items', async () => {
  const result = (await pipe.transform(
    { title: ' My plan ' },
    createMetadata,
  )) as CreatePersonalLearningPathDto;
  expect(result.title).toBe('My plan');
  expect(result.items).toBeUndefined();
});

it.each([
  {},
  { title: '   ' },
  { title: null },
  { title: 'a'.repeat(201) },
  { title: 'Plan', description: 'a'.repeat(5001) },
  { title: 'Plan', ownerUserId: 'another-owner' },
  { title: 'Plan', items: null },
  { title: 'Plan', items: [{ materialId: 'a', position: -1 }] },
  { title: 'Plan', items: [{ materialId: 'a', position: 0.5 }] },
  { title: 'Plan', items: [{ materialId: 'a', position: 2_147_483_648 }] },
  { title: 'Plan', items: [{ materialId: ' ', position: 0 }] },
  { title: 'Plan', items: [{ materialId: 'a' }] },
  { title: 'Plan', items: [null] },
  { title: 'Plan', items: [[{ materialId: 'a', position: 0 }]] },
  { title: 'Plan', items: [1] },
  { title: 'Plan', items: [{ materialId: 'a', position: 0, pathId: 'other' }] },
  {
    title: 'Plan',
    items: [
      { materialId: 'a', position: 0 },
      { materialId: 'a', position: 1 },
    ],
  },
  {
    title: 'Plan',
    items: [
      { materialId: 'a', position: 0 },
      { materialId: 'b', position: 0 },
    ],
  },
])('rejects invalid creation input: %j', async (input) => {
  await expect(pipe.transform(input, createMetadata)).rejects.toBeInstanceOf(
    BadRequestException,
  );
});

it.each([{ description: null }, { items: [] }, { title: 'Changed' }])(
  'accepts partial updates: %j',
  async (input) => {
    await expect(pipe.transform(input, updateMetadata)).resolves.toMatchObject(
      input,
    );
  },
);

it.each([
  { title: null },
  { title: ' ' },
  { items: null },
  { ownerUserId: 'other' },
  {
    items: [
      { materialId: 'a', position: 0 },
      { materialId: 'a', position: 1 },
    ],
  },
])('rejects invalid update input: %j', async (input) => {
  await expect(pipe.transform(input, updateMetadata)).rejects.toBeInstanceOf(
    BadRequestException,
  );
});
