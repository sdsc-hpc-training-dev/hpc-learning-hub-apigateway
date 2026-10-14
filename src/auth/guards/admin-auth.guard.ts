import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../decorators/current-user.decorator';
import { UserRole } from '../../database/entities/user.entity';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRole = request.currentUser?.role;

    if (!userRole) {
      throw new UnauthorizedException();
    } else if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }

    return true;
  }
}
