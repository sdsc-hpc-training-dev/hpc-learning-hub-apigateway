import { NotFoundException } from '@nestjs/common';
import { User, UserRole } from '../database/entities/user.entity';
import { UsersRepository } from './persistence/user.repository';
import { UsersService } from './users.service';

function setup(email: string | null = 'learner@example.com') {
  const user = Object.assign(new User(), {
    id: 'user-id',
    email,
    username: 'learner',
    role: UserRole.LEARNER,
    displayName: 'Learner',
    lastLoginAt: new Date(),
    authIdentity: { subject: 'provider-subject' },
    sessions: ['private-session'],
  });
  const findUserById = jest.fn().mockResolvedValue(user);
  const service = new UsersService({
    findUserById,
  } as unknown as UsersRepository);
  return { service, user, findUserById };
}

it.each(['learner@example.com', null])(
  'returns a public current-account summary with email %s',
  async (email) => {
    const { service, user, findUserById } = setup(email);
    await expect(service.findUserById(user.id)).resolves.toEqual({
      id: user.id,
      email,
      username: user.username,
      role: user.role,
    });
    expect(findUserById).toHaveBeenCalledWith(user.id);
  },
);

it('returns not found when the session user no longer exists', async () => {
  const { service, findUserById } = setup();
  findUserById.mockResolvedValue(null);
  await expect(service.findUserById('missing-id')).rejects.toBeInstanceOf(
    NotFoundException,
  );
});
