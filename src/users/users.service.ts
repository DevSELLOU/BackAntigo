import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { Company } from 'src/companies/company.entity';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { UpdateCustomerClientDto } from 'src/presentation/customers-clients/dtos/update-customer-client.dto';
import { Customer } from 'src/presentation/customers/customer.entity';
import { PaymentCondition } from 'src/presentation/payment-conditions/payment-condition.entity';
import { PaymentMethod } from 'src/presentation/payment-methods/payment-method.entity';
import { UserCompany } from 'src/user-companies/user-company.entity';
import { UserCompanyStatus } from 'src/user-companies/enums/user-company-status.enum';
import { buildFilterQuery, buildSortQuery } from 'src/utils/query-utils';
import { buildFullTextSearchWhere } from 'src/utils/fulltext-utils';
import { EmailsService } from '../emails/emails.service';
import { generatePassword } from '../utils/generate-password.util';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';
import { User } from './user.entity';
import { UsersMapper } from './users.mapper';
import { DashboardDTO } from 'src/dashboard/dtos/dashboard.dto';
import { logger } from 'src/utils/logger';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UsersMapper)
    private readonly usersMapper: UsersMapper,
    @Inject(EmailsService)
    private readonly emailsService: EmailsService,
    @Inject('USER_REPOSITORY')
    private usersRepository: typeof User,
  ) {}

  getModel(): typeof User {
    return User;
  }

  async hasRoleOrHigher(
    userId: number,
    requiredRoles: UserRole[],
  ): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return false;
    }

    if (requiredRoles.includes(user.role)) {
      return true;
    }

    return false;
  }

  async createUser(
    createUserDto: CreateUserDto,
    companyId?: number,
    customerId?: number,
  ): Promise<User> {
    const userExists = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (userExists) {
      throw new BadRequestException(
        'Já existe um usuário com o e-mail informado',
      );
    }

    const password = generatePassword();

    const userMapped: Partial<User> =
      await this.usersMapper.createUserDtoToUser(
        createUserDto,
        password,
        companyId,
        customerId,
      );

    const user = await this.usersRepository.create(userMapped.dataValues);

    // The login gate reads `UserCompanies` (auth.service.ts -> getCompaniesForLogin), not
    // `User.companyId`. Creating the user without this row means a 401 on every sign-in attempt
    // until the next backend boot, when `migrateUserCompanies` backfills it — so a customer
    // registered during the day could not enter the storefront that same day.
    if (companyId) {
      await UserCompany.findOrCreate({
        where: { userId: user.id, companyId },
        defaults: {
          userId: user.id,
          companyId,
          role: user.role,
          status: UserCompanyStatus.ACTIVE,
          position: user.position,
        } as any,
      });
    }

    this.emailsService
      .sendEmail(user.email, 'Bem-vindo ao sistema - SELLOU', 'welcome', {
        fullName: user.name,
        email: user.email,
        password,
        year: new Date().getFullYear(),
      })
      .catch((error) => {
        logger.error('Falha ao enviar e-mail de boas-vindas:', error);
      });

    return user;
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findByPk(id);

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return user;
  }

  async findOneWithNoRole(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return user;
  }

  async findAll(findAllUsersDto: BaseFindAllDataDto): Promise<{
    data: User[];
    metadata: { page: number; limit: number; total: number };
  }> {
    try {
      const { page = 1, limit = 10, sort, filters, query } = findAllUsersDto;

      const parsedFilters = filters ? JSON.parse(filters) : {};
      const parsedSort = sort ? JSON.parse(sort) : {};

      const filterQuery = buildFilterQuery(parsedFilters);
      const sortQuery = buildSortQuery(parsedSort);

      if (query) {
        filterQuery[Op.or] = [
          buildFullTextSearchWhere(['name'], query),
          { email: { [Op.iLike]: `%${query}%` } },
          Sequelize.where(Sequelize.cast(Sequelize.col('id'), 'TEXT'), {
            [Op.iLike]: `%${query}%`,
          }),
        ];
      }

      filterQuery.role = UserRole.Administrator;

      const total = await this.usersRepository.count({ where: filterQuery });

      const data = await this.usersRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        limit,
      });

      return {
        data,
        metadata: { page, limit, total },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Erro ao buscar: ${error.message}`,
      );
    }
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOneWithNoRole(id);

    const userMapped = await this.usersMapper.updateUserDtoToUser(
      user,
      updateUserDto,
    );

    await user.update(userMapped);
    await user.save();
    return user;
  }

  async updateStatus(
    id: number,
    updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<User> {
    const user = await this.findOneWithNoRole(id);

    const userMapped = await this.usersMapper.updateUserStatusDtoToStatus(
      user,
      updateUserStatusDto,
    );

    await this.usersRepository.update(userMapped, {
      where: { id },
    });

    return user;
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.findOneWithNoRole(id);

    await user.destroy();
  }

  async activateUser(id: number): Promise<void> {
    const user = await this.findOneWithNoRole(id);

    if (user.status !== UserStatus.Onboarding) {
      throw new BadRequestException(
        `Não é possível ativar um usuário que não está no status Onboarding`,
      );
    }

    await this.usersRepository.update(
      { status: UserStatus.Active },
      { where: { id } },
    );
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) throw new NotFoundException(`Usuário não encontrado`);

    return user;
  }

  async findByEmailOptional(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
    });
  }

  async updatePasswordResetToken(
    id: number,
    passwordResetToken: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.usersRepository.update(
      {
        password_reset_token: passwordResetToken,
        password_reset_expires: expiresAt,
      },
      { where: { id } },
    );
  }

  async findByPasswordResetToken(token: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user)
      throw new NotFoundException(`Token de recuperação inválido ou expirado`);

    return user;
  }

  async updatePassword(id: number, password: string): Promise<void> {
    await this.usersRepository.update(
      { password, password_reset_token: null, password_reset_expires: null },
      { where: { id } },
    );
  }

  async findCompanyUserIds(companyId: number): Promise<number[]> {
    const rows = await UserCompany.findAll({
      where: { companyId, status: UserCompanyStatus.ACTIVE },
      attributes: ['userId'],
    });
    return rows.map((row) => row.userId);
  }

  async findCompanyUser(companyId: number, userId: number): Promise<User> {
    const userCompany = await UserCompany.findOne({
      where: {
        companyId,
        userId,
        role: UserRole.CompanyAdministrator,
        status: UserCompanyStatus.ACTIVE,
      },
    });

    if (!userCompany) throw new NotFoundException(`Usuário não encontrado`);

    const user = await this.usersRepository.findByPk(userId);
    if (!user) throw new NotFoundException(`Usuário não encontrado`);

    return user;
  }

  async findCompanyUsers(
    companyId: number,
    findAllDto: BaseFindAllDataDto,
  ): Promise<{
    data: User[];
    metadata: { page: number; limit: number; total: number };
  }> {
    try {
      const { page = 1, limit = 10, sort, filters, query } = findAllDto;

      const parsedFilters = filters ? JSON.parse(filters) : {};
      const parsedSort = sort ? JSON.parse(sort) : {};

      const filterQuery = buildFilterQuery(parsedFilters);
      const sortQuery = buildSortQuery(parsedSort);

      if (query) {
        filterQuery[Op.or] = [
          buildFullTextSearchWhere(['name'], query),
          { email: { [Op.iLike]: `%${query}%` } },
          Sequelize.where(Sequelize.cast(Sequelize.col('id'), 'TEXT'), {
            [Op.iLike]: `%${query}%`,
          }),
        ];
      }

      const userCompanyRows = await UserCompany.findAll({
        where: { companyId, status: UserCompanyStatus.ACTIVE },
        attributes: ['userId'],
      });

      const userIds = userCompanyRows.map((uc) => uc.userId);
      filterQuery.id = { [Op.in]: userIds };

      const total = await this.usersRepository.count({ where: filterQuery });

      const data = await this.usersRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        limit,
      });

      return {
        data,
        metadata: { page, limit, total },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Erro ao buscar: ${error.message}`,
      );
    }
  }

  async findOneByEmailForLogin(email: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: { email },
      include: [
        {
          model: Customer,
          include: [PaymentCondition, PaymentMethod],
        },
        Company,
        {
          model: UserCompany,
          required: false,
        },
      ],
    });
  }

  async getNumberOfActiveUsers(): Promise<number> {
    return await this.usersRepository.count({
      where: {
        status: UserStatus.Active,
      },
    });
  }

  async getCompanyActiveUsers(data: DashboardDTO): Promise<number> {
    const { companyId, months, years, cities, state } = data;

    const userCompanyRows = await UserCompany.findAll({
      where: { companyId, status: UserCompanyStatus.ACTIVE },
      attributes: ['userId'],
    });

    const userIds = userCompanyRows.map((uc) => uc.userId);

    const whereConditions: { [key: string | symbol]: any } = {
      id: { [Op.in]: userIds },
      status: UserStatus.Active,
    };
    const dateConditions = [];

    if (months && months.length > 0) {
      const monthConditions = months.map((monthStr) => {
        const [year, month] = monthStr.split('-').map(Number);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
          throw new BadRequestException(
            `Invalid month format in months parameter: ${monthStr}`,
          );
        }
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        return {
          createdAt: { [Op.between]: [startDate, endDate] },
        };
      });
      dateConditions.push(...monthConditions);
    }

    if (years && years.length > 0) {
      const yearConditions = years.map((yearStr) => {
        const year = Number(yearStr);
        if (isNaN(year)) {
          throw new BadRequestException(
            `Invalid year format in years parameter: ${yearStr}`,
          );
        }
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        return { createdAt: { [Op.between]: [startDate, endDate] } };
      });
      dateConditions.push(...yearConditions);
    }

    if (dateConditions.length > 0) {
      whereConditions[Op.or] = dateConditions;
    }

    const customerInclude: any = {
      model: Customer,
      required: false,
      where: {},
    };

    if (state) {
      customerInclude.where.UF = { [Op.in]: state };
    }
    if (cities) {
      customerInclude.where.city = { [Op.in]: cities };
    }

    return await this.usersRepository.count({
      where: whereConditions,
      include:
        Object.keys(customerInclude.where).length > 0 ? [customerInclude] : [],
    });
  }

  async findOneCustomerClient(
    companyId: number,
    customerId: number,
    id: number,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { companyId, customerId, id, role: UserRole.CustomerClient },
    });

    if (!user) throw new NotFoundException(`Cliente final não encontrado`);

    return user;
  }

  async findCustomerClients(
    companyId: number,
    customerId: number,
    findAllDto: BaseFindAllDataDto,
  ): Promise<{
    data: User[];
    metadata: { page: number; limit: number; total: number };
  }> {
    try {
      const { page = 1, limit = 10, sort, filters, query } = findAllDto;

      const parsedFilters = filters ? JSON.parse(filters) : {};
      const parsedSort = sort ? JSON.parse(sort) : {};

      const filterQuery = buildFilterQuery(parsedFilters);
      const sortQuery = buildSortQuery(parsedSort);

      if (query) {
        filterQuery[Op.or] = [
          buildFullTextSearchWhere(['name'], query),
          { email: { [Op.iLike]: `%${query}%` } },
          Sequelize.where(Sequelize.cast(Sequelize.col('id'), 'TEXT'), {
            [Op.iLike]: `%${query}%`,
          }),
        ];
      }

      filterQuery.companyId = companyId;
      filterQuery.customerId = customerId;
      filterQuery.role = UserRole.CustomerClient;

      const total = await this.usersRepository.count({ where: filterQuery });

      const data = await this.usersRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        limit,
      });

      return {
        data,
        metadata: { page, limit, total },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Erro ao buscar: ${error.message}`,
      );
    }
  }

  async updateCustomerClient(
    companyId: number,
    customerId: number,
    id: number,
    updateCustomerClientDto: UpdateCustomerClientDto,
  ): Promise<User> {
    const user = await this.findOneCustomerClient(companyId, customerId, id);

    const updateUserDto = new UpdateUserDto();
    updateUserDto.name = updateCustomerClientDto.name;

    const userMapped = await this.usersMapper.updateUserDtoToUser(
      user,
      updateUserDto,
    );

    await user.update(userMapped);
    await user.save();
    return user;
  }

  async deleteCustomerClient(
    companyId: number,
    customerId: number,
    id: number,
  ) {
    const user = await this.findOneCustomerClient(companyId, customerId, id);

    await user.destroy();

    return;
  }
}
