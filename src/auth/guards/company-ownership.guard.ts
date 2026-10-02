import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class CompanyOwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;
    const body = request.body;

    if (!user) {
      return false;
    }

    if (user.role === UserRole.Administrator) {
      return true;
    }

    const companyIdFromParams = params.companyId || params.id;
    const companyIdFromBody = body.companyId;

    const requestedCompanyId = companyIdFromParams || companyIdFromBody;

    if (!requestedCompanyId) {
      return true;
    }

    const activeCompanyId = user.activeCompanyId || user.companyId;

    if (Number(activeCompanyId) !== Number(requestedCompanyId)) {
      throw new ForbiddenException('Você não tem acesso a dados desta empresa');
    }

    return true;
  }
}
