import { Injectable } from '@nestjs/common';
import { fn, col, Op } from 'sequelize';
import { Customer } from 'src/presentation/customers/customer.entity';
import { Order } from 'src/presentation/orders/order.entity';
import { Product } from 'src/presentation/products/entities/product.entity';
import { User } from 'src/users/user.entity';
import { UserCompany } from 'src/user-companies/user-company.entity';
import { UserCompanyStatus } from 'src/user-companies/enums/user-company-status.enum';

@Injectable()
export class DashboardFilterService {
  async getCompanyStates(companyId: number): Promise<{ data: string[] }> {
    const states = await Customer.findAll({
      attributes: [[fn('DISTINCT', col('UF')), 'UF']],
      where: {
        companyId,
        UF: { [Op.ne]: null },
      },
      raw: true,
    });
    return { data: states.map((result: any) => result.UF).sort() };
  }

  async getCompanyCities(companyId: number): Promise<{ data: string[] }> {
    const cities = await Customer.findAll({
      attributes: [[fn('DISTINCT', col('city')), 'city']],
      where: {
        companyId,
        city: { [Op.ne]: null },
      },
      raw: true,
    });
    const response = cities.map((result: any) => result.city).sort();
    return { data: response };
  }

  async getCompanyProducts(companyId: number): Promise<{ data: string[] }> {
    const products = await Product.findAll({
      attributes: [[fn('DISTINCT', col('Product.name')), 'name']],
      where: {
        companyId,
        name: { [Op.ne]: null },
      },
      raw: true,
      order: [[col('Product.name'), 'ASC']],
    });
    return { data: products.map((p: any) => p.name) };
  }

  async getCompanyCustomers(
    companyId: number,
  ): Promise<{ data: { id: number; name: string }[] }> {
    const customers = await Customer.findAll({
      attributes: ['id', ['corporateName', 'name']],
      where: {
        companyId,
        corporateName: { [Op.ne]: null },
      },
      order: [['corporateName', 'ASC']],
    });
    return {
      data: customers.map((c) => c.get({ plain: true })) as {
        id: number;
        name: string;
      }[],
    };
  }

  async getResponsibleUsers(
    companyId: number,
  ): Promise<{ data: { id: number; name: string }[] }> {
    const orderUsers = await User.findAll({
      attributes: ['id', 'name'],
      include: [
        {
          model: Order,
          where: { companyId },
        },
      ],
    });

    const userCompanyRows = await UserCompany.findAll({
      where: { companyId, status: UserCompanyStatus.ACTIVE },
      attributes: ['userId'],
    });

    const userCompanyUsers = await User.findAll({
      attributes: ['id', 'name'],
      where: {
        id: { [Op.in]: userCompanyRows.map((uc) => uc.userId) },
      },
    });

    const seen = new Set<number>();
    const combined = [...orderUsers, ...userCompanyUsers];
    const unique = combined.filter((user) => {
      if (seen.has(user.id)) return false;
      seen.add(user.id);
      return true;
    });

    return {
      data: unique.map((user) => user.get({ plain: true })) as {
        id: number;
        name: string;
      }[],
    };
  }

  async getManagers(
    companyId: number,
  ): Promise<{ data: { id: number; name: string }[] }> {
    const managers = await Order.findAll({
      attributes: [
        [col('manager.id'), 'id'],
        [col('manager.name'), 'name'],
      ],
      where: {
        companyId,
        managerId: { [Op.ne]: null },
      },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: [],
          required: true,
        },
      ],
      group: ['manager.id', 'manager.name'],
      order: [[col('manager.name'), 'ASC']],
      raw: true,
    });
    return { data: managers as unknown as { id: number; name: string }[] };
  }
}
