import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../database/entities/user.entity';

export interface CurrentUserIdentity {
  id: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  currentUser?: CurrentUserIdentity;
  sessionId?: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserIdentity => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.currentUser) throw new UnauthorizedException();

    return request.currentUser;
  },
);
