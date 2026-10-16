import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { CilogonClientService } from './cilogon.service';
import { AuthenticationRepository } from './persistence/auth.repository';

function setup() {
  const createLoginTransaction = jest.fn().mockResolvedValue({});
  const buildLoginUrl = jest.fn(
    (input: { state: string; nonce: string; pkceVerifier: string }) => {
      const url = new URL('https://cilogon.org/authorize');
      url.searchParams.set('state', input.state);
      url.searchParams.set('nonce', input.nonce);
      return Promise.resolve(url);
    },
  );
  const service = new AuthService(
    { createLoginTransaction } as unknown as AuthenticationRepository,
    { buildLoginUrl } as unknown as CilogonClientService,
    {} as ConfigService,
  );
  return { service, createLoginTransaction, buildLoginUrl };
}

const hash = (value: string) =>
  createHash('sha256').update(value).digest('base64url');

it('persists hashes tied to the authorization request and returned browser binding', async () => {
  const { service, createLoginTransaction, buildLoginUrl } = setup();
  const result = await service.startCilogonLogin();
  const input = buildLoginUrl.mock.calls[0]?.[0];
  if (!input) throw new Error('Expected authorization request');
  for (const value of [
    input.state,
    input.nonce,
    input.pkceVerifier,
    result.browserBinding,
  ]) {
    expect(value).toMatch(/^[\w-]{43}$/);
  }
  expect(
    new Set([
      input.state,
      input.nonce,
      input.pkceVerifier,
      result.browserBinding,
    ]).size,
  ).toBe(4);
  expect(createLoginTransaction).toHaveBeenCalledWith({
    stateHash: hash(input.state),
    nonce: input.nonce,
    pkceVerifier: input.pkceVerifier,
    browserBindingHash: hash(result.browserBinding),
    returnTo: null,
    expiresAt: result.expiresAt,
  });
  expect(new URL(result.authorizationUrl).searchParams.get('state')).toBe(
    input.state,
  );
  expect(new URL(result.authorizationUrl).searchParams.get('nonce')).toBe(
    input.nonce,
  );
  expect(result).toEqual({
    authorizationUrl: expect.any(String) as string,
    browserBinding: expect.any(String) as string,
    expiresAt: expect.any(Date) as Date,
  });
});

it('expires the login attempt exactly ten minutes after initiation', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-14T12:00:00Z'));
  try {
    const { service, createLoginTransaction } = setup();
    const result = await service.startCilogonLogin();
    expect(result.expiresAt).toEqual(new Date('2026-10-14T12:10:00Z'));
    expect(createLoginTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: result.expiresAt }),
    );
  } finally {
    jest.useRealTimers();
  }
});

it('generates fresh security values for each attempt', async () => {
  const { service, buildLoginUrl } = setup();
  const first = await service.startCilogonLogin();
  const second = await service.startCilogonLogin();
  const firstInput = buildLoginUrl.mock.calls[0]?.[0];
  const secondInput = buildLoginUrl.mock.calls[1]?.[0];
  expect(firstInput?.state).not.toBe(secondInput?.state);
  expect(firstInput?.nonce).not.toBe(secondInput?.nonce);
  expect(firstInput?.pkceVerifier).not.toBe(secondInput?.pkceVerifier);
  expect(first.browserBinding).not.toBe(second.browserBinding);
});

it('does not store an attempt if authorization URL construction fails', async () => {
  const { service, buildLoginUrl, createLoginTransaction } = setup();
  const error = new Error('CILogon unavailable');
  buildLoginUrl.mockRejectedValue(error);
  await expect(service.startCilogonLogin()).rejects.toBe(error);
  expect(createLoginTransaction).not.toHaveBeenCalled();
});

it('propagates insert failures instead of returning redirect or cookie information', async () => {
  const { service, createLoginTransaction } = setup();
  const error = new Error('Database unavailable');
  createLoginTransaction.mockRejectedValue(error);
  await expect(service.startCilogonLogin()).rejects.toBe(error);
});

it('waits for the attempt to be saved before returning login information', async () => {
  const { service, createLoginTransaction } = setup();
  let finishSave!: () => void;
  createLoginTransaction.mockReturnValue(
    new Promise<void>((resolve) => {
      finishSave = resolve;
    }),
  );
  const finished = jest.fn();
  const pending = service.startCilogonLogin().then(finished);
  await Promise.resolve();
  expect(createLoginTransaction).toHaveBeenCalledTimes(1);
  expect(finished).not.toHaveBeenCalled();
  finishSave();
  await pending;
  expect(finished).toHaveBeenCalledTimes(1);
});
