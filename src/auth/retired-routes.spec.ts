import { RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { UsersController } from '../users/users.controller';
import { AuthController } from './auth.controller';
import { SessionAuthGuard } from './guards/session-auth.guard';

function routes(controller: typeof AuthController | typeof UsersController) {
  return Object.getOwnPropertyNames(controller.prototype)
    .filter((name) => name !== 'constructor')
    .map((name) => {
      const handler = Object.getOwnPropertyDescriptor(
        controller.prototype,
        name,
      )?.value as object;
      return {
        method: Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod,
        path: Reflect.getMetadata(PATH_METADATA, handler) as string,
        guards: Reflect.getMetadata(GUARDS_METADATA, handler) as unknown,
        status: Reflect.getMetadata(HTTP_CODE_METADATA, handler) as
          number | undefined,
      };
    });
}

it('removes both password login routes while preserving guarded logout with 204', () => {
  const handlers = routes(AuthController);
  expect(
    handlers.some((route) => ['login', 'verify-login'].includes(route.path)),
  ).toBe(false);
  expect(handlers).toContainEqual({
    method: RequestMethod.POST,
    path: 'logout',
    guards: [SessionAuthGuard],
    status: 204,
  });
});

it('removes public registration while keeping account reads and role updates', () => {
  const handlers = routes(UsersController);
  expect(
    handlers.some(
      (route) => route.path === 'users' && route.method === RequestMethod.POST,
    ),
  ).toBe(false);
  expect(handlers).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        method: RequestMethod.GET,
        path: 'me',
        guards: [SessionAuthGuard],
      }),
      expect.objectContaining({ method: RequestMethod.GET, path: 'users' }),
      expect.objectContaining({
        method: RequestMethod.PATCH,
        path: 'users/:userId/role',
      }),
    ]),
  );
});
