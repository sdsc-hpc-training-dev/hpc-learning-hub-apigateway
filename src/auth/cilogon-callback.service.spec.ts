import {
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { CilogonClientService } from './cilogon.service';
import { AuthenticationRepository } from './persistence/auth.repository';

const state = 's'.repeat(43);
const binding = 'b'.repeat(43);
const callback = 'https://api.example.org/api/v1/auth/cilogon/callback';
const path = `/api/v1/auth/cilogon/callback?code=authorization-code&state=${state}`;
const hash = (value: string) =>
  createHash('sha256').update(value).digest('base64url');

function setup() {
  const attempt = {
    nonce: 'stored-nonce',
    pkceVerifier: 'stored-verifier',
    returnTo: 'https://untrusted.example',
  };
  const consumeLoginTransaction = jest.fn().mockResolvedValue(attempt);
  const establishCilogonSession = jest.fn().mockResolvedValue(undefined);
  const exchangeCode = jest.fn().mockResolvedValue({
    iss: 'https://cilogon.org',
    sub: 'cilogon-subject',
    email: ' Learner@Example.org ',
    name: ' Learner ',
    role: 'ADMIN',
  });
  const configuration = new Map([
    ['CILOGON_REDIRECT_URI', callback],
    ['FRONTEND_URL', 'https://frontend.example.org/learning'],
  ]);
  const getOrThrow = jest.fn((key: string) => {
    const value = configuration.get(key);
    if (!value) throw new Error('Missing configuration');
    return value;
  });
  const service = new AuthService(
    {
      consumeLoginTransaction,
      establishCilogonSession,
    } as unknown as AuthenticationRepository,
    { exchangeCode } as unknown as CilogonClientService,
    { getOrThrow } as unknown as ConfigService,
  );
  return {
    service,
    attempt,
    consumeLoginTransaction,
    establishCilogonSession,
    exchangeCode,
    getOrThrow,
  };
}

it('binds the callback to its browser and stored nonce/verifier, then persists only a session hash', async () => {
  const {
    service,
    consumeLoginTransaction,
    exchangeCode,
    establishCilogonSession,
  } = setup();
  const result = await service.completeCilogonLogin(
    path,
    binding,
    '192.0.2.1',
    'browser',
  );
  expect(consumeLoginTransaction).toHaveBeenCalledWith(
    hash(state),
    hash(binding),
  );
  expect(exchangeCode).toHaveBeenCalledWith(
    new URL(callback + `?code=authorization-code&state=${state}`),
    {
      state,
      nonce: 'stored-nonce',
      pkceVerifier: 'stored-verifier',
    },
  );
  expect(result.token).toMatch(/^[\w-]{43}$/);
  expect(establishCilogonSession).toHaveBeenCalledWith({
    issuer: 'https://cilogon.org',
    subject: 'cilogon-subject',
    email: 'learner@example.org',
    displayName: 'Learner',
    identityProvider: null,
    tokenHash: hash(result.token),
    expiresAt: result.expiresAt,
    ipAddress: '192.0.2.1',
    userAgent: 'browser',
  });
  expect(result.redirectUrl).toBe('https://frontend.example.org/learning');
});

it('creates a 24-hour session after successful validation', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-15T12:00:00Z'));
  try {
    const { service } = setup();
    const result = await service.completeCilogonLogin(
      path,
      binding,
      null,
      null,
    );
    expect(result.expiresAt).toEqual(new Date('2026-10-16T12:00:00Z'));
  } finally {
    jest.useRealTimers();
  }
});

it('accepts missing profile information and never passes provider roles to provisioning', async () => {
  const { service, exchangeCode, establishCilogonSession } = setup();
  exchangeCode.mockResolvedValue({
    iss: 'https://cilogon.org',
    sub: 'subject',
    role: 'ADMIN',
  });
  await service.completeCilogonLogin(path, binding, null, null);
  expect(establishCilogonSession).toHaveBeenCalledWith(
    expect.objectContaining({
      email: null,
      displayName: null,
      identityProvider: null,
    }),
  );
  const calls = establishCilogonSession.mock.calls as unknown[][];
  expect(calls[0]?.[0]).not.toHaveProperty('role');
});

it.each([
  ['/api/v1/auth/cilogon/callback?code=x', binding],
  [path + `&state=${state}`, binding],
  ['/api/v1/auth/cilogon/callback?code=x&state=invalid', binding],
  [path, undefined],
  [path, 'invalid'],
])(
  'rejects invalid state or browser binding before accessing the database',
  async (url, cookie) => {
    const { service, consumeLoginTransaction, exchangeCode } = setup();
    await expect(
      service.completeCilogonLogin(url, cookie, null, null),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(consumeLoginTransaction).not.toHaveBeenCalled();
    expect(exchangeCode).not.toHaveBeenCalled();
  },
);

it('does not exchange codes or create sessions for unmatched, expired, or replayed attempts', async () => {
  const {
    service,
    consumeLoginTransaction,
    exchangeCode,
    establishCilogonSession,
  } = setup();
  consumeLoginTransaction.mockResolvedValue(null);
  await expect(
    service.completeCilogonLogin(path, binding, null, null),
  ).rejects.toBeInstanceOf(UnauthorizedException);
  expect(exchangeCode).not.toHaveBeenCalled();
  expect(establishCilogonSession).not.toHaveBeenCalled();
});

it.each([
  `?error=access_denied&state=${state}`,
  `?state=${state}`,
  `?state=${state}&code=x&code=y`,
  `?state=${state}&code=`,
])(
  'consumes a valid attempt but rejects cancelled or malformed authorization responses: %s',
  async (query) => {
    const {
      service,
      consumeLoginTransaction,
      exchangeCode,
      establishCilogonSession,
    } = setup();
    await expect(
      service.completeCilogonLogin(
        '/api/v1/auth/cilogon/callback' + query,
        binding,
        null,
        null,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(consumeLoginTransaction).toHaveBeenCalledTimes(1);
    expect(exchangeCode).not.toHaveBeenCalled();
    expect(establishCilogonSession).not.toHaveBeenCalled();
  },
);

it('returns a sanitized authentication error if the provider exchange or validation fails', async () => {
  const { service, exchangeCode, establishCilogonSession } = setup();
  exchangeCode.mockRejectedValue(new Error('secret provider diagnostic'));
  await expect(
    service.completeCilogonLogin(path, binding, null, null),
  ).rejects.toThrow('CILogon authentication failed');
  expect(establishCilogonSession).not.toHaveBeenCalled();
});

it.each([
  { iss: 'https://evil.example', sub: 'subject' },
  { iss: 'https://cilogon.org', sub: '' },
  { iss: 'https://cilogon.org', sub: 'subject', email: ['invalid'] },
])('rejects invalid identity/profile claims: %j', async (claims) => {
  const { service, exchangeCode, establishCilogonSession } = setup();
  exchangeCode.mockResolvedValue(claims);
  await expect(
    service.completeCilogonLogin(path, binding, null, null),
  ).rejects.toBeInstanceOf(UnauthorizedException);
  expect(establishCilogonSession).not.toHaveBeenCalled();
});

it('propagates provisioning conflicts without reporting a successful session', async () => {
  const { service, establishCilogonSession } = setup();
  const error = new ConflictException('Email collision');
  establishCilogonSession.mockRejectedValue(error);
  await expect(
    service.completeCilogonLogin(path, binding, null, null),
  ).rejects.toBe(error);
});

it('waits for account/session persistence before returning a token', async () => {
  const { service, establishCilogonSession } = setup();
  let finish!: () => void;
  establishCilogonSession.mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  const finished = jest.fn();
  const pending = service
    .completeCilogonLogin(path, binding, null, null)
    .then(finished);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  expect(establishCilogonSession).toHaveBeenCalledTimes(1);
  expect(finished).not.toHaveBeenCalled();
  finish();
  await pending;
  expect(finished).toHaveBeenCalledTimes(1);
});

it.each(['javascript:alert(1)', 'https://user:pass@example.org'])(
  'rejects unsafe configured frontend URLs: %s',
  async (frontend) => {
    const { service, getOrThrow, consumeLoginTransaction } = setup();
    getOrThrow.mockImplementation((key) =>
      key === 'FRONTEND_URL' ? frontend : callback,
    );
    await expect(
      service.completeCilogonLogin(path, binding, null, null),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(consumeLoginTransaction).not.toHaveBeenCalled();
  },
);
