import { UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { UserRole } from '../../database/entities/user.entity';
import { CurrentUser } from './current-user.decorator';

class DecoratedController {
  retrieve(@CurrentUser() user: unknown): void {
    void user;
  }
}

const currentUserFactory = () => {
  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    DecoratedController,
    'retrieve',
  ) as Record<
    string,
    { factory: (data: unknown, context: unknown) => unknown }
  >;

  return Object.values(metadata)[0]!.factory;
};

describe('CurrentUser decorator', () => {
  it('returns the authenticated identity added by the session guard', () => {
    const currentUser = { id: 'user-id', role: UserRole.LEARNER };
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ currentUser }) }),
    };

    expect(currentUserFactory()(undefined, context)).toEqual(currentUser);
  });

  it('rejects use outside an authenticated request', () => {
    const context = {
      switchToHttp: () => ({ getRequest: () => ({}) }),
    };

    expect(() => currentUserFactory()(undefined, context)).toThrow(
      UnauthorizedException,
    );
  });
});
