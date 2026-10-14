import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { User, UserRole } from '../database/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { AuthenticationRepository } from './persistence/auth.repository';
import { PasswordService } from './password.service';
import { AuthService } from './auth.service';

const user: User = {
  id: 'user-id',
  email: 'learner@example.com',
  username: 'learner',
  passwordHash: 'stored-hash',
  role: UserRole.LEARNER,
  createdAt: new Date(),
  updatedAt: new Date(),
  sessions: [],
  challenges: [],
  personalLearningPaths: [],
  bookmarks: [],
};

const input: LoginDto = {
  emailOrUsername: ' Learner@Example.com ',
  password: 'a-long-enough-password',
};

// The service setup and its three behavior cases are kept together deliberately.
// eslint-disable-next-line max-lines-per-function
describe('AuthService loginUser', () => {
  let findUserByNameOrEmail: jest.Mock;
  let createLoginChallenge: jest.Mock;
  let verifyPassword: jest.Mock;
  let sendLoginCode: jest.Mock;
  let challengeInput: { codeHash: string; expiresAt: Date } | undefined;
  let deliveredLoginCode:
    { email: string; code: string; expiresAt: Date } | undefined;
  let service: AuthService;

  beforeEach(() => {
    findUserByNameOrEmail = jest.fn();
    createLoginChallenge = jest.fn();
    verifyPassword = jest.fn();
    sendLoginCode = jest.fn();
    challengeInput = undefined;
    deliveredLoginCode = undefined;
    service = new AuthService(
      {
        findUserByNameOrEmail,
        createLoginChallenge,
      } as unknown as AuthenticationRepository,
      { verify: verifyPassword } as unknown as PasswordService,
      { sendLoginCode },
    );
  });

  it('creates a hashed login challenge and emails its raw code', async () => {
    findUserByNameOrEmail.mockResolvedValue(user);
    verifyPassword.mockResolvedValue(true);
    createLoginChallenge.mockImplementation(
      (challenge: { codeHash: string; expiresAt: Date }) => {
        challengeInput = challenge;
        return Promise.resolve({
          id: 'challenge-id',
          expiresAt: challenge.expiresAt,
        });
      },
    );
    sendLoginCode.mockImplementation(
      (email: string, code: string, expiresAt: Date) => {
        deliveredLoginCode = { email, code, expiresAt };
        return Promise.resolve();
      },
    );

    const response = await service.loginUser(input);

    expect(findUserByNameOrEmail).toHaveBeenCalledWith('learner@example.com');
    expect(verifyPassword).toHaveBeenCalledWith(
      input.password,
      user.passwordHash,
    );
    expect(createLoginChallenge).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id }),
    );
    expect(challengeInput).toBeDefined();
    expect(deliveredLoginCode).toBeDefined();
    expect(deliveredLoginCode!.code).toMatch(/^\d{6}$/);
    expect(challengeInput!.codeHash).toBe(
      createHash('sha256').update(deliveredLoginCode!.code).digest('base64url'),
    );
    expect(deliveredLoginCode!.expiresAt).toEqual(challengeInput!.expiresAt);
    expect(deliveredLoginCode!.email).toBe(user.email);
    expect(response).toEqual({
      challengeId: 'challenge-id',
      expiresAt: deliveredLoginCode!.expiresAt,
    });
  });

  it('rejects an unknown identity without creating a challenge', async () => {
    findUserByNameOrEmail.mockResolvedValue(null);

    await expect(service.loginUser(input)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(createLoginChallenge).not.toHaveBeenCalled();
    expect(sendLoginCode).not.toHaveBeenCalled();
  });

  it('rejects an incorrect password without creating a challenge', async () => {
    findUserByNameOrEmail.mockResolvedValue(user);
    verifyPassword.mockResolvedValue(false);

    await expect(service.loginUser(input)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(createLoginChallenge).not.toHaveBeenCalled();
    expect(sendLoginCode).not.toHaveBeenCalled();
  });
});
