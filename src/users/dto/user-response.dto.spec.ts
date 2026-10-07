import { UserRole } from '../../database/entities/user.entity';
import { UserResponseDto } from './user-response.dto';

it('represents the safe fields returned by user endpoints', () => {
  const response = Object.assign(new UserResponseDto(), {
    id: 'user-id',
    email: 'learner@example.com',
    username: 'learner',
    role: UserRole.LEARNER,
  });

  expect(response).toEqual({
    id: 'user-id',
    email: 'learner@example.com',
    username: 'learner',
    role: UserRole.LEARNER,
  });
});
