import { DataSource } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UsersRepository } from './user.repository';

const user = { id: 'user-id' } as User;
const publicFields = {
  id: true,
  email: true,
  username: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const createRepository = () => {
  const find = jest.fn().mockResolvedValue([user]);
  const findOne = jest.fn().mockResolvedValue(user);
  const create = jest.fn().mockReturnValue(user);
  const save = jest.fn().mockResolvedValue(user);
  const query = {
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(user),
  };
  const repository = new UsersRepository({
    getRepository: jest.fn().mockReturnValue({
      find,
      findOne,
      create,
      save,
      createQueryBuilder: jest.fn().mockReturnValue(query),
    }),
  } as unknown as DataSource);

  return { repository, find, findOne, create, save, query };
};

it('lists users using only public fields in creation order', async () => {
  const { repository, find } = createRepository();

  await expect(repository.findAllUsers()).resolves.toEqual([user]);
  expect(find).toHaveBeenCalledWith({
    select: publicFields,
    order: { createdAt: 'ASC' },
  });
});

it('finds a user by id using only public fields', async () => {
  const { repository, findOne } = createRepository();

  await expect(repository.findUserById('user-id')).resolves.toEqual(user);
  expect(findOne).toHaveBeenCalledWith({
    where: { id: 'user-id' },
    select: publicFields,
  });
});
