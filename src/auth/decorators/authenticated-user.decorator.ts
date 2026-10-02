import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUserDto } from '../dtos/authenticated-user.dto';

export const AuthAdministrator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUserDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
