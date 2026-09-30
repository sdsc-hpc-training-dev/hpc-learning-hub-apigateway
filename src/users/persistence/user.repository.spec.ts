import { DataSource } from 'typeorm';
import { User, UserRole } from '../../database/entities/user.entity';
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

it('finds a user by id without selecting its password hash', async () => {
  const { repository, findOne } = createRepository();

  await expect(repository.findUserById('user-id')).resolves.toEqual(user);
  expect(findOne).toHaveBeenCalledWith({
    where: { id: 'user-id' },
    select: publicFields,
  });
});

it('looks up a user by either email or username for duplicate detection', async () => {
  const { repository, query } = createRepository();

  await expect(
    repository.findByEmailOrUsername('learner@example.com', 'learner'),
  ).resolves.toEqual(user);
  expect(query.where).toHaveBeenCalledWith('user.email = :email', {
    email: 'learner@example.com',
  });
  expect(query.orWhere).toHaveBeenCalledWith('user.username = :username', {
    username: 'learner',
  });
});

it('persists every newly registered user as a learner', async () => {
  const { repository, create, save } = createRepository();

  await expect(
    repository.createUser({
      email: 'learner@example.com',
      username: 'learner',
      passwordHash: 'stored-hash',
    }),
  ).resolves.toEqual(user);
  expect(create).toHaveBeenCalledWith({
    email: 'learner@example.com',
    username: 'learner',
    passwordHash: 'stored-hash',
    role: UserRole.LEARNER,
  });
  expect(save).toHaveBeenCalledWith(user);
});
