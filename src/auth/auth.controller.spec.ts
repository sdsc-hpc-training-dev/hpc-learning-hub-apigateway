import { LoginDto } from './dto/login.dto';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  const loginUser = jest.fn();
  const verifyLogin = jest.fn();
  const controller = new AuthController({
    loginUser,
    verifyLogin,
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

  it('sets a cookie with the exact expiration supplied by the service', async () => {
    const expiresAt = new Date('2026-10-07T12:00:00Z');
    verifyLogin.mockResolvedValue({ token: 'raw-token', expiresAt });
    const input = { challengeId: 'challenge-id', code: '123456' };
    const get = jest.fn().mockReturnValue('test-browser');
    const cookie = jest.fn();
    await controller.verifyLogin(
      input,
      { ip: '127.0.0.1', get } as unknown as Request,
      { cookie } as unknown as Response,
    );
    expect(verifyLogin).toHaveBeenCalledWith(
      input,
      '127.0.0.1',
      'test-browser',
    );
    expect(cookie).toHaveBeenCalledWith('session', 'raw-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
  });
});

it('leaves the cookie unset when verification fails', async () => {
  const error = new UnauthorizedException(
    'Invalid or expired verification code',
  );
  const verifyLogin = jest.fn().mockRejectedValue(error);
  const controller = new AuthController({
    verifyLogin,
  } as unknown as AuthService);
  const cookie = jest.fn();
  await expect(
    controller.verifyLogin(
      { challengeId: 'challenge-id', code: '123456' },
      { get: jest.fn() } as unknown as Request,
      { cookie } as unknown as Response,
    ),
  ).rejects.toBe(error);
  expect(verifyLogin).toHaveBeenCalledWith(
    { challengeId: 'challenge-id', code: '123456' },
    null,
    null,
  );
  expect(cookie).not.toHaveBeenCalled();
});

it('sets a Secure host-only session cookie in production without returning the token', async () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const expiresAt = new Date('2026-10-07T12:00:00Z');
    const verifyLogin = jest
      .fn()
      .mockResolvedValue({ token: 'raw-token', expiresAt });
    const controller = new AuthController({
      verifyLogin,
    } as unknown as AuthService);
    const cookie = jest.fn();
    await expect(
      controller.verifyLogin(
        { challengeId: 'challenge-id', code: '123456' },
        { get: jest.fn() } as unknown as Request,
        { cookie } as unknown as Response,
      ),
    ).resolves.toBeUndefined();
    expect(cookie).toHaveBeenCalledWith('__Host-session', 'raw-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
  } finally {
    if (original === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = original;
  }
});
