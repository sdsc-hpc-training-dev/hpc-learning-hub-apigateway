import { UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from './decorators/current-user.decorator';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { sessionCookieClearOptions, sessionCookieName } from './session-cookie';

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
