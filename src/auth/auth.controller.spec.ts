import { LoginDto } from './dto/login.dto';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const loginUser = jest.fn();
  const controller = new AuthController({
    loginUser,
  } as unknown as AuthService);

  beforeEach(() => jest.clearAllMocks());

  it('passes login input to the service', async () => {
    const input: LoginDto = {
      emailOrUsername: 'learner@example.com',
      password: 'a-long-enough-password',
    };
    const output = { challengeId: 'challenge-id', expiresAt: new Date() };
    loginUser.mockResolvedValue(output);

    await expect(controller.loginUser(input)).resolves.toEqual(output);
    expect(loginUser).toHaveBeenCalledWith(input);
  });
});
