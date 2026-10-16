import { UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  oidcLoginCookieClearOptions,
  oidcLoginCookieName,
} from './oidc-login-cookie';
import { sessionCookieName, sessionCookieOptions } from './session-cookie';

function setup(
  cookieHeader = `unrelated=x; ${oidcLoginCookieName()}=browser-binding`,
) {
  const result = {
    token: 'local-session-token',
    expiresAt: new Date('2026-10-16T12:00:00Z'),
    redirectUrl: 'https://frontend.example.org/',
  };
  const completeCilogonLogin = jest.fn().mockResolvedValue(result);
  const controller = new AuthController({
    completeCilogonLogin,
  } as unknown as AuthService);
  const request = {
    originalUrl: '/api/v1/auth/cilogon/callback?code=abc&state=xyz',
    headers: { cookie: cookieHeader, host: 'untrusted.example' },
    ip: '192.0.2.1',
    get: jest.fn().mockReturnValue('test-browser'),
  } as unknown as Request;
  const cookie = jest.fn();
  const clearCookie = jest.fn();
  const redirect = jest.fn();
  const json = jest.fn();
  const response = {
    cookie,
    clearCookie,
    redirect,
    json,
  } as unknown as Response;
  return {
    controller,
    request,
    response,
    completeCilogonLogin,
    cookie,
    clearCookie,
    redirect,
    json,
    result,
  };
}

it('registers a public CILogon callback without a session guard', () => {
  const handler = Object.getOwnPropertyDescriptor(
    AuthController.prototype,
    'completeCilogonLogin',
  )?.value as object;
  expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('cilogon/callback');
  expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toBeUndefined();
  expect(Reflect.getMetadata(GUARDS_METADATA, AuthController)).toBeUndefined();
});

it.each(['development', 'production'])(
  'sets the committed application session, clears only the login cookie, and redirects in %s',
  async (environment) => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = environment;
    try {
      const {
        controller,
        request,
        response,
        completeCilogonLogin,
        cookie,
        clearCookie,
        redirect,
        json,
        result,
      } = setup();
      await controller.completeCilogonLogin(request, response);
      expect(completeCilogonLogin).toHaveBeenCalledWith(
        request.originalUrl,
        'browser-binding',
        request.ip,
        'test-browser',
      );
      expect(cookie).toHaveBeenCalledTimes(1);
      expect(cookie).toHaveBeenCalledWith(
        sessionCookieName(),
        result.token,
        sessionCookieOptions(result.expiresAt),
      );
      expect(clearCookie).toHaveBeenCalledWith(
        oidcLoginCookieName(),
        oidcLoginCookieClearOptions(),
      );
      expect(clearCookie).not.toHaveBeenCalledWith(
        sessionCookieName(),
        expect.anything(),
      );
      expect(redirect).toHaveBeenCalledWith(302, result.redirectUrl);
      expect(json).not.toHaveBeenCalled();
    } finally {
      if (original === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = original;
    }
  },
);

it.each(['', 'unrelated=x', 'oidc-login=first; oidc-login=second'])(
  'passes missing or ambiguous login cookies as absent: %s',
  async (header) => {
    const { controller, request, response, completeCilogonLogin } =
      setup(header);
    await controller.completeCilogonLogin(request, response);
    expect(completeCilogonLogin).toHaveBeenCalledWith(
      request.originalUrl,
      undefined,
      request.ip,
      'test-browser',
    );
  },
);

it('clears the temporary cookie but never issues a session or redirects after failure', async () => {
  const {
    controller,
    request,
    response,
    completeCilogonLogin,
    cookie,
    clearCookie,
    redirect,
  } = setup();
  const error = new UnauthorizedException('Invalid attempt');
  completeCilogonLogin.mockRejectedValue(error);
  await expect(controller.completeCilogonLogin(request, response)).rejects.toBe(
    error,
  );
  expect(cookie).not.toHaveBeenCalled();
  expect(redirect).not.toHaveBeenCalled();
  expect(clearCookie).toHaveBeenCalledWith(
    oidcLoginCookieName(),
    oidcLoginCookieClearOptions(),
  );
});

it('waits for the completed login before issuing a cookie', async () => {
  const {
    controller,
    request,
    response,
    completeCilogonLogin,
    cookie,
    redirect,
    result,
  } = setup();
  let finish!: (value: typeof result) => void;
  completeCilogonLogin.mockReturnValue(
    new Promise<typeof result>((resolve) => {
      finish = resolve;
    }),
  );
  const pending = controller.completeCilogonLogin(request, response);
  await Promise.resolve();
  expect(cookie).not.toHaveBeenCalled();
  expect(redirect).not.toHaveBeenCalled();
  finish(result);
  await pending;
  expect(cookie).toHaveBeenCalledTimes(1);
});
