import type { CookieOptions } from 'express';

export function oidcLoginCookieName(): string {
  return process.env.NODE_ENV === 'production'
    ? '__Host-oidc-login'
    : 'oidc-login';
}

export function oidcLoginCookieClearOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

export function oidcLoginCookieOptions(expiresAt: Date): CookieOptions {
  return { ...oidcLoginCookieClearOptions(), expires: expiresAt };
}
