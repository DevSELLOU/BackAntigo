import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CompanyOwnershipGuard } from '../../src/auth/guards/company-ownership.guard';
import { RolesGuard } from '../../src/auth/guards/roles.guard';
import { RoutesVisitsController } from '../../src/routes-visits/routes-visits.controller';
import { UserRole } from '../../src/users/enums/user-role.enum';

describe('daily agenda access', () => {
  const reflector = new Reflector();
  const context = (user: object, companyId = '7', method = 'findMyDay') =>
    ({
      getHandler: () => RoutesVisitsController.prototype[method],
      switchToHttp: () => ({
        getRequest: () => ({ user, params: { companyId }, body: {} }),
      }),
    }) as any;

  it('applies company ownership to routes and visits', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, RoutesVisitsController),
    ).toContain(CompanyOwnershipGuard);
    const guard = new CompanyOwnershipGuard(reflector);
    const user = { id: 23, role: UserRole.SalesRep, activeCompanyId: 7 };
    expect(guard.canActivate(context(user))).toBe(true);
    expect(() => guard.canActivate(context(user, '8'))).toThrow();
  });

  it.each(['findMyDay', 'createScheduledVisit'])(
    'protects %s from customer users',
    (method) => {
      const guard = new RolesGuard(reflector);
      expect(
        guard.canActivate(
          context({ role: UserRole.CustomerClient }, '7', method),
        ),
      ).toBe(false);
      expect(
        guard.canActivate(context({ role: UserRole.SalesRep }, '7', method)),
      ).toBe(true);
    },
  );

  it('uses authenticated identity for the daily query', async () => {
    const service = {
      findMyDay: jest
        .fn()
        .mockResolvedValue({ data: [], metadata: { total: 0 } }),
    };
    const controller = new RoutesVisitsController(
      {} as any,
      {} as any,
      service as any,
    );
    await controller.findMyDay(7, { date: '2026-10-16' }, { id: 23 } as any);
    expect(service.findMyDay).toHaveBeenCalledWith(7, 23, '2026-10-16');
  });
});
