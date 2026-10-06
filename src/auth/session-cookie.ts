import type { CookieOptions } from 'express';

export function sessionCookieName(): string {
  return process.env.NODE_ENV === 'production' ? '__Host-session' : 'session';
}

export function sessionCookieOptions(expiresAt: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  };
}
