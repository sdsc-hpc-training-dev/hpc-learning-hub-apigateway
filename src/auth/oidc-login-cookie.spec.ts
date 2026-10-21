import {
  oidcLoginCookieName,
  oidcLoginCookieOptions,
  oidcLoginCookieClearOptions,
} from './oidc-login-cookie';
import { sessionCookieName } from './session-cookie';

it.each(['development', 'production'])(
  'uses a separate HttpOnly browser-binding cookie in %s',
  (environment) => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = environment;
    try {
      const expiresAt = new Date('2026-10-14T12:10:00Z');
      expect(oidcLoginCookieName()).toBe(
        environment === 'production' ? '__Host-oidc-login' : 'oidc-login',
      );
      expect(oidcLoginCookieName()).not.toBe(sessionCookieName());
      expect(oidcLoginCookieOptions(expiresAt)).toEqual({
        httpOnly: true,
        secure: environment === 'production',
        sameSite: 'lax',
        path: '/',
        expires: expiresAt,
      });
      expect(oidcLoginCookieClearOptions()).toEqual({
        httpOnly: true,
        secure: environment === 'production',
        sameSite: 'lax',
        path: '/',
      });
    } finally {
      if (original === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = original;
    }
  },
);
