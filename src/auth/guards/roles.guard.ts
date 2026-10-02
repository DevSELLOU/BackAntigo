import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserRoleHierarchy } from '../../users/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const userRole = user.role as UserRole;

    if (!userRole) {
      return false;
    }

    if (requiredRoles.includes(userRole)) {
      return true;
    }

    const userRoleLevel = UserRoleHierarchy[userRole];
    if (userRoleLevel === undefined) {
      return false;
    }

    for (const requiredRole of requiredRoles) {
      const requiredLevel = UserRoleHierarchy[requiredRole];
      if (userRoleLevel >= requiredLevel) {
        return true;
      }
    }

    return false;
  }
}
