import { Op } from 'sequelize';
import { Customer } from 'src/presentation/customers/customer.entity';
import { UserCompany } from './user-company.entity';
import { UserCompanyStatus } from './enums/user-company-status.enum';
import { logger } from 'src/utils/logger';

export async function migrateUserCompanies(userModel: any) {
  try {
    const usersWithCompany = await userModel.findAll({
      where: {
        companyId: { [Op.ne]: null },
      },
      attributes: ['id', 'companyId', 'role'],
    });

    // Storefront customers are the reason this second pass exists: they are created against a
    // Customer, and when `User.companyId` is left null the pass above cannot see them at all — so
    // they never get a `UserCompanies` row and `getCompaniesForLogin` rejects their sign-in with a
    // 401 forever. Their company is still recoverable through the customer they belong to.
    const usersWithoutCompany = await userModel.findAll({
      where: {
        companyId: { [Op.is]: null },
        customerId: { [Op.ne]: null },
      },
      attributes: ['id', 'customerId', 'role'],
    });

    const customerIds: number[] = [
      ...new Set(usersWithoutCompany.map((user: any) => user.customerId)),
    ] as number[];

    const customers = customerIds.length
      ? await Customer.findAll({
          where: { id: { [Op.in]: customerIds } },
          attributes: ['id', 'companyId'],
          raw: true,
        })
      : [];

    const companyByCustomer = new Map<number, number>(
      customers
        .filter((customer: any) => customer.companyId)
        .map((customer: any) => [customer.id, customer.companyId]),
    );

    const usersResolvedByCustomer = usersWithoutCompany
      .map((user: any) => ({
        id: user.id,
        role: user.role,
        companyId: companyByCustomer.get(user.customerId),
      }))
      .filter((user: any) => Boolean(user.companyId));

    usersWithCompany.push(...usersResolvedByCustomer);

    if (usersWithCompany.length === 0) {
      return;
    }

    const existingRecords = await UserCompany.findAll({
      attributes: ['userId', 'companyId'],
      raw: true,
    });

    const existingSet = new Set(
      existingRecords.map((r: any) => `${r.userId}-${r.companyId}`),
    );

    const missingRecords = usersWithCompany
      .filter((user: any) => !existingSet.has(`${user.id}-${user.companyId}`))
      .map((user: any) => ({
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
        status: UserCompanyStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    if (missingRecords.length === 0) {
      return;
    }

    logger.log(
      `Migrando ${missingRecords.length} usuários para a nova tabela user_companies...`,
    );

    await UserCompany.bulkCreate(missingRecords, {
      ignoreDuplicates: true,
    });

    logger.log('Migração de usuários-empresas concluída com sucesso');
  } catch (error) {
    logger.error('Erro na migração de usuários-empresas:', error);
  }
}
