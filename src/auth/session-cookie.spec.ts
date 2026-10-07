import { sessionCookieName, sessionCookieOptions } from './session-cookie';

const originalEnvironment = process.env.NODE_ENV;
afterEach(() => {
  if (originalEnvironment === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalEnvironment;
});

it.each(['production', 'development'])(
  'configures a valid cookie for %s',
  (environment) => {
    process.env.NODE_ENV = environment;
    const expiresAt = new Date();
    expect(sessionCookieName()).toBe(
      environment === 'production' ? '__Host-session' : 'session',
    );
    expect(sessionCookieOptions(expiresAt)).toEqual({
      httpOnly: true,
      secure: environment === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
  },
);
