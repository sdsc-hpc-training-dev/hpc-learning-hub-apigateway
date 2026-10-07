import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '../../database/entities/user.entity';
import { AdminAuthGuard } from './admin-auth.guard';

function contextFor(role?: UserRole): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        currentUser: role ? { id: 'user-id', role } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

it('allows an authenticated administrator', () => {
  expect(new AdminAuthGuard().canActivate(contextFor(UserRole.ADMIN))).toBe(
    true,
  );
});

it.each([UserRole.LEARNER, UserRole.MAINTAINER])(
  'rejects an authenticated %s',
  (role) => {
    expect(() => new AdminAuthGuard().canActivate(contextFor(role))).toThrow(
      ForbiddenException,
    );
  },
);

it('rejects a missing session identity', () => {
  expect(() => new AdminAuthGuard().canActivate(contextFor())).toThrow(
    UnauthorizedException,
  );
});
