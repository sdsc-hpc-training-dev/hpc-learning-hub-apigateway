import { UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from './decorators/current-user.decorator';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { sessionCookieClearOptions, sessionCookieName } from './session-cookie';
import {
  oidcLoginCookieName,
  oidcLoginCookieOptions,
} from './oidc-login-cookie';

function setup() {
  const logoutUser = jest.fn().mockResolvedValue(undefined);
  const clearCookie = jest.fn();
  const controller = new AuthController({
    logoutUser,
  } as unknown as AuthService);
  const request = { sessionId: 'session-id' } as AuthenticatedRequest;
  const response = { clearCookie } as unknown as Response;
  return { controller, logoutUser, clearCookie, request, response };
}

it('revokes the authenticated session and clears its cookie without a response body', async () => {
  const { controller, logoutUser, clearCookie, request, response } = setup();
  await expect(
    controller.logoutUser(request, response),
  ).resolves.toBeUndefined();
  expect(logoutUser).toHaveBeenCalledWith('session-id');
  expect(clearCookie).toHaveBeenCalledWith(
    sessionCookieName(),
    sessionCookieClearOptions(),
  );
});

it('waits for revocation before clearing the cookie', async () => {
  const { controller, logoutUser, clearCookie, request, response } = setup();
  let resolveRevocation!: () => void;
  logoutUser.mockReturnValue(
    new Promise<void>((resolve) => {
      resolveRevocation = resolve;
    }),
  );
  const pending = controller.logoutUser(request, response);
  await Promise.resolve();
  expect(clearCookie).not.toHaveBeenCalled();
  resolveRevocation();
  await pending;
  expect(clearCookie).toHaveBeenCalledTimes(1);
});

it('does not clear the cookie when revocation fails', async () => {
  const { controller, logoutUser, clearCookie, request, response } = setup();
  const error = new Error('Database unavailable');
  logoutUser.mockRejectedValue(error);
  await expect(controller.logoutUser(request, response)).rejects.toBe(error);
  expect(clearCookie).not.toHaveBeenCalled();
});

it('rejects logout without an authenticated session', async () => {
  const { controller, logoutUser, clearCookie, response } = setup();
  await expect(
    controller.logoutUser({} as AuthenticatedRequest, response),
  ).rejects.toBeInstanceOf(UnauthorizedException);
  expect(logoutUser).not.toHaveBeenCalled();
  expect(clearCookie).not.toHaveBeenCalled();
});

function loginSetup() {
  const result = {
    authorizationUrl: 'https://cilogon.org/authorize?state=random-state',
    browserBinding: 'browser-binding',
    expiresAt: new Date('2026-10-14T12:10:00Z'),
  };
  const startCilogonLogin = jest.fn().mockResolvedValue(result);
  const cookie = jest.fn();
  const redirect = jest.fn();
  const json = jest.fn();
  const controller = new AuthController({
    startCilogonLogin,
  } as unknown as AuthService);
  const response = { cookie, redirect, json } as unknown as Response;
  return {
    controller,
    startCilogonLogin,
    cookie,
    redirect,
    json,
    response,
    result,
  };
}

it.each(['development', 'production'])(
  'sets only the temporary cookie and redirects to CILogon in %s',
  async (environment) => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = environment;
    try {
      const { controller, response, result, cookie, redirect, json } =
        loginSetup();
      await expect(
        controller.startCilogonLogin(response),
      ).resolves.toBeUndefined();
      expect(cookie).toHaveBeenCalledTimes(1);
      expect(cookie).toHaveBeenCalledWith(
        oidcLoginCookieName(),
        result.browserBinding,
        oidcLoginCookieOptions(result.expiresAt),
      );
      expect(redirect).toHaveBeenCalledWith(302, result.authorizationUrl);
      expect(cookie.mock.invocationCallOrder[0]).toBeLessThan(
        redirect.mock.invocationCallOrder[0]!,
      );
      expect(json).not.toHaveBeenCalled();
    } finally {
      if (original === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = original;
    }
  },
);

it('does not set a cookie or redirect when login initiation fails', async () => {
  const { controller, startCilogonLogin, cookie, redirect, response } =
    loginSetup();
  const error = new Error('Could not persist login attempt');
  startCilogonLogin.mockRejectedValue(error);
  await expect(controller.startCilogonLogin(response)).rejects.toBe(error);
  expect(cookie).not.toHaveBeenCalled();
  expect(redirect).not.toHaveBeenCalled();
});

it('waits for login preparation before sending cookies or a redirect', async () => {
  const { controller, startCilogonLogin, cookie, redirect, response, result } =
    loginSetup();
  let finish!: (value: typeof result) => void;
  startCilogonLogin.mockReturnValue(
    new Promise<typeof result>((resolve) => {
      finish = resolve;
    }),
  );
  const pending = controller.startCilogonLogin(response);
  await Promise.resolve();
  expect(cookie).not.toHaveBeenCalled();
  expect(redirect).not.toHaveBeenCalled();
  finish(result);
  await pending;
  expect(redirect).toHaveBeenCalledTimes(1);
});
