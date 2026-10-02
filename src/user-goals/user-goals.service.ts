import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { CompaniesService } from 'src/companies/companies.service';
import { ProductsService } from 'src/presentation/products/products.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.entity';
import { buildFilterQuery, buildSortQuery } from 'src/utils/query-utils';
import { buildFullTextSearchWhere } from 'src/utils/fulltext-utils';
import { logger } from 'src/utils/logger';
import { CreateUserGoalDto } from './dtos/create-user-goal.dto';
import { FindAllUserGoalsDto } from './dtos/find-all-user-goals.dto';
import { UpdateUserGoalDto } from './dtos/update-user-goal.dto';
import { UserGoal } from './entities/user-goal.entity';
import { UserGoalProduct } from './entities/user-goal-product.entity';
import { UserGoalType } from './enums/user-goal-type.enum';
import { UserGoalsMapper } from './user-goals.mapper';

@Injectable()
export class UserGoalsService {
  private readonly logger = new Logger(UserGoalsService.name);

  constructor(
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(ProductsService)
    private readonly productsService: ProductsService,
    @Inject(UserGoalsMapper)
    private readonly userGoalsMapper: UserGoalsMapper,
    @Inject('USER_GOAL_REPOSITORY')
    private userGoalsRepository: typeof UserGoal,
    @Inject('USER_GOAL_PRODUCT_REPOSITORY')
    private userGoalProductsRepository: typeof UserGoalProduct,
  ) {}

  getModel() {
    return this.userGoalsRepository;
  }

  private async checkGoalOverlap(
    userId: number,
    type: UserGoalType,
    startDate: string,
    endDate: string,
    excludeGoalId?: number,
    productIds?: number[],
  ): Promise<void> {
    const whereClause: any = {
      userId,
      type,
      [Op.or]: [
        {
          startDate: { [Op.between]: [startDate, endDate] },
        },
        {
          endDate: { [Op.between]: [startDate, endDate] },
        },
        {
          [Op.and]: [
            { startDate: { [Op.lte]: startDate } },
            { endDate: { [Op.gte]: endDate } },
          ],
        },
      ],
    };

    if (excludeGoalId) {
      whereClause.id = { [Op.ne]: excludeGoalId };
    }

    const existingGoals = await this.userGoalsRepository.findAll({
      where: whereClause,
      include: ['userGoalProducts'],
    });

    if (
      type === UserGoalType.ProductSales &&
      productIds &&
      productIds.length > 0
    ) {
      const existingProductIds = new Set<number>();
      for (const goal of existingGoals) {
        for (const product of goal.userGoalProducts || []) {
          existingProductIds.add(product.productId);
        }
      }
      const hasOverlap = productIds.some((id) => existingProductIds.has(id));
      if (hasOverlap) {
        this.logger.warn({
          action: 'checkGoalOverlap',
          message: 'Goal overlap detected for product sales',
          userId,
          type,
          startDate,
          endDate,
          productIds,
          existingProductIds: Array.from(existingProductIds),
        });
        throw new BadRequestException(
          'Já existe uma meta para este usuário, tipo, período e produto',
        );
      }
      return;
    }

    if (existingGoals.length > 0) {
      this.logger.warn({
        action: 'checkGoalOverlap',
        message: 'Goal overlap detected',
        userId,
        type,
        startDate,
        endDate,
        existingGoalsCount: existingGoals.length,
      });
      throw new BadRequestException(
        'Já existe uma meta para este usuário, tipo e período',
      );
    }
  }

  async createUserGoal(
    companyId: number,
    createUserGoalDto: CreateUserGoalDto,
  ): Promise<UserGoal> {
    logger.info(
      `[USER-GOALS-SERVICE] Creating goal | companyId: ${companyId} | userId: ${createUserGoalDto.userId} | type: ${createUserGoalDto.type}`,
    );

    await this.companiesService.findOne(companyId);
    await this.usersService.findOneWithNoRole(createUserGoalDto.userId);

    logger.info(
      `[USER-GOALS-SERVICE] Checking goal overlap | userId: ${createUserGoalDto.userId} | type: ${createUserGoalDto.type}`,
    );

    await this.checkGoalOverlap(
      createUserGoalDto.userId,
      createUserGoalDto.type,
      createUserGoalDto.startDate,
      createUserGoalDto.endDate,
      undefined,
      createUserGoalDto.products?.map((p) => p.productId),
    );

    logger.info(
      `[USER-GOALS-SERVICE] Mapping DTO to model | companyId: ${companyId}`,
    );

    const userGoalMapped: Partial<UserGoal> =
      await this.userGoalsMapper.createUserGoalDtoToUserGoal(
        createUserGoalDto,
        companyId,
      );

    logger.info(
      `[USER-GOALS-SERVICE] Persisting goal to database | companyId: ${companyId}`,
    );

    const userGoal = await this.userGoalsRepository.create({
      ...userGoalMapped.dataValues,
      companyId,
    });

    if (
      createUserGoalDto.products &&
      createUserGoalDto.products.length > 0 &&
      createUserGoalDto.type === UserGoalType.ProductSales
    ) {
      logger.info(
        `[USER-GOALS-SERVICE] Creating goal products | goalId: ${userGoal.id} | productsCount: ${createUserGoalDto.products.length}`,
      );

      const productIds = createUserGoalDto.products
        .map((p) => p.productId)
        .filter((id) => id > 0);

      if (productIds.length > 0) {
        await this.productsService.findAllByIds(productIds, companyId);

        const userGoalProducts = createUserGoalDto.products
          .filter((p) => p.productId > 0)
          .map((product) => ({
            userGoalId: userGoal.id,
            productId: product.productId,
            totalToSell: product.totalToSell,
          }));

        await this.userGoalProductsRepository.bulkCreate(userGoalProducts);
      }
    }

    this.logger.log({
      action: 'createUserGoal',
      message: 'User goal created successfully',
      goalId: userGoal.id,
    });

    return this.findOne(companyId, userGoal.id);
  }

  async findOne(companyId: number, id: number): Promise<UserGoal> {
    await this.companiesService.findOne(companyId);

    const userGoal = await this.userGoalsRepository.findOne({
      where: { id, companyId },
      include: ['user', 'userGoalProducts'],
    });

    if (!userGoal) throw new NotFoundException('Meta não encontrada');

    return userGoal;
  }

  async findAll(
    companyId: number,
    findAllDto: FindAllUserGoalsDto,
  ): Promise<{
    data: UserGoal[];
    metadata: { page: number; limit: number; total: number };
  }> {
    await this.companiesService.findOne(companyId);

    const { page = 1, limit = 10, sort, filters, query, userId } = findAllDto;

    const parsedFilters = filters ? JSON.parse(filters) : {};
    const parsedSort = sort ? JSON.parse(sort) : {};

    const filterQuery = buildFilterQuery(parsedFilters, UserGoal);
    const sortQuery = buildSortQuery(parsedSort);

    filterQuery.companyId = companyId;

    if (userId) {
      filterQuery.userId = userId;
    }

    if (query) {
      filterQuery[Op.or] = buildFullTextSearchWhere(['name'], query, 'user');
    }

    const includeUser = query
      ? [{ model: User, as: 'user', required: true }]
      : [];

    const total = await this.userGoalsRepository.count({
      where: filterQuery,
      include: includeUser,
    });

    const data = await this.userGoalsRepository.findAll({
      where: filterQuery,
      order: sortQuery,
      offset: (page - 1) * limit,
      limit,
      include: [...includeUser, 'userGoalProducts'],
    });

    return {
      data,
      metadata: { page, limit, total },
    };
  }

  async updateUserGoal(
    companyId: number,
    id: number,
    updateUserGoalDto: UpdateUserGoalDto,
  ): Promise<UserGoal> {
    logger.info(
      `[USER-GOALS-SERVICE] Updating goal | goalId: ${id} | companyId: ${companyId}`,
    );

    await this.companiesService.findOne(companyId);

    const userGoal = await this.findOne(companyId, id);

    const hasDateOrTypeChange =
      (updateUserGoalDto.startDate &&
        updateUserGoalDto.startDate !== userGoal.startDate) ||
      (updateUserGoalDto.endDate &&
        updateUserGoalDto.endDate !== userGoal.endDate) ||
      (updateUserGoalDto.type && updateUserGoalDto.type !== userGoal.type);

    if (hasDateOrTypeChange) {
      const newType = updateUserGoalDto.type || userGoal.type;
      const newStartDate = updateUserGoalDto.startDate || userGoal.startDate;
      const newEndDate = updateUserGoalDto.endDate || userGoal.endDate;

      logger.info(
        `[USER-GOALS-SERVICE] Checking goal overlap after update | goalId: ${id} | userId: ${userGoal.userId} | type: ${newType}`,
      );

      await this.checkGoalOverlap(
        userGoal.userId,
        newType,
        newStartDate,
        newEndDate,
        id,
        updateUserGoalDto.products?.map((p) => p.productId),
      );
    }

    logger.info(`[USER-GOALS-SERVICE] Mapping DTO to model | goalId: ${id}`);

    const userGoalMapped =
      await this.userGoalsMapper.updateUserGoalDtoToUserGoal(
        userGoal,
        updateUserGoalDto,
      );

    await userGoal.update(userGoalMapped);
    await userGoal.save();

    logger.info(
      `[USER-GOALS-SERVICE] Goal updated successfully | goalId: ${id} | companyId: ${companyId}`,
    );

    if (
      updateUserGoalDto.products &&
      updateUserGoalDto.products.length > 0 &&
      userGoal.type === UserGoalType.ProductSales
    ) {
      logger.info(
        `[USER-GOALS-SERVICE] Updating goal products | goalId: ${userGoal.id} | productsCount: ${updateUserGoalDto.products.length}`,
      );
      await this.userGoalProductsRepository.destroy({
        where: { userGoalId: userGoal.id },
      });

      const validProducts = updateUserGoalDto.products.filter(
        (p) => p.productId > 0,
      );

      if (validProducts.length > 0) {
        const productIds = validProducts.map((p) => p.productId);
        await this.productsService.findAllByIds(productIds, companyId);

        const userGoalProducts = validProducts.map((product) => ({
          userGoalId: userGoal.id,
          productId: product.productId,
          totalToSell: product.totalToSell,
        }));

        await this.userGoalProductsRepository.bulkCreate(userGoalProducts);
      }
    }

    this.logger.log({
      action: 'updateUserGoal',
      message: 'User goal updated successfully',
      goalId: id,
    });

    return this.findOne(companyId, id);
  }

  async deleteUserGoal(companyId: number, id: number): Promise<void> {
    logger.info(
      `[USER-GOALS-SERVICE] Deleting goal | goalId: ${id} | companyId: ${companyId}`,
    );

    await this.companiesService.findOne(companyId);

    const userGoal = await this.findOne(companyId, id);

    logger.info(`[USER-GOALS-SERVICE] Deleting goal products | goalId: ${id}`);

    await this.userGoalProductsRepository.destroy({
      where: { userGoalId: userGoal.id },
    });

    await userGoal.destroy();

    logger.info(
      `[USER-GOALS-SERVICE] Goal deleted successfully | goalId: ${id} | companyId: ${companyId}`,
    );
  }

  async getUserGoalsByUser(
    companyId: number,
    userId: number,
  ): Promise<UserGoal[]> {
    logger.info(
      `[USER-GOALS-SERVICE] Getting user goals | userId: ${userId} | companyId: ${companyId}`,
    );

    await this.companiesService.findOne(companyId);
    await this.usersService.findOneWithNoRole(userId);

    return await this.userGoalsRepository.findAll({
      where: { userId, companyId },
      include: ['userGoalProducts'],
    });
  }

  async getDashboardSummary(
    companyId: number,
    year?: number,
    userId?: number,
    month?: number,
  ): Promise<{
    globalAttainment: number;
    totalValue: number;
    metaValue: number;
    totalClients: number;
    metaClients: number;
    activeClientsPercent: number;
    productMix: number;
    metaProductMix: number;
    lineItems: number;
    metaLineItems: number;
    clientsWithOrders: number;
    metaClientsWithOrders: number;
    byMonth: { month: number; actual: number; goal: number }[];
    byUser: {
      userId: number;
      userName: string;
      accumulated: number;
      meta: number;
      attainment: number;
      status: string;
    }[];
    goals: UserGoal[];
  }> {
    await this.companiesService.findOne(companyId);

    const currentYear = year || new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;

    const whereClause: any = {
      companyId,
      startDate: { [Op.lte]: endDate },
      endDate: { [Op.gte]: startDate },
    };

    if (userId) {
      whereClause.userId = userId;
    }

    const goals = await this.userGoalsRepository.findAll({
      where: whereClause,
      include: [
        'user',
        {
          association: 'userGoalProducts',
          include: ['product'],
        },
      ],
    });

    let filteredGoals = goals;
    if (month) {
      const monthStart = `${currentYear}-${String(month).padStart(2, '0')}-01`;
      const monthEnd = new Date(currentYear, month, 0)
        .toISOString()
        .split('T')[0];
      filteredGoals = goals.filter((g) => {
        const gStart = g.startDate || '';
        const gEnd = g.endDate || '';
        return gStart <= monthEnd && gEnd >= monthStart;
      });
    }

    let totalValue = 0;
    let metaValue = 0;
    let totalClients = 0;
    let metaClients = 0;
    let productMix = 0;
    let metaProductMix = 0;
    let lineItems = 0;
    let metaLineItems = 0;
    let clientsWithOrders = 0;
    let metaClientsWithOrders = 0;

    const userMap = new Map<
      number,
      { name: string; accumulated: number; meta: number }
    >();

    for (const goal of filteredGoals) {
      const target = Number(goal.targetValue) || 0;
      const current = Number(goal.currentValue) || 0;

      if (goal.type === UserGoalType.SalesValue) {
        totalValue += current;
        metaValue += target;

        if (!userMap.has(goal.userId)) {
          userMap.set(goal.userId, {
            name: goal.user?.name || 'Unknown',
            accumulated: 0,
            meta: 0,
          });
        }
        const userData = userMap.get(goal.userId)!;
        userMap.set(goal.userId, {
          ...userData,
          accumulated: userData.accumulated + current,
          meta: userData.meta + target,
        });
      } else if (goal.type === UserGoalType.NewClients) {
        totalClients += current;
        metaClients += target;
      } else if (goal.type === UserGoalType.ProductSales) {
        productMix += current;
        metaProductMix += target;
      } else if (goal.type === UserGoalType.LineItems) {
        lineItems += current;
        metaLineItems += target;
      } else if (goal.type === UserGoalType.ClientsWithOrders) {
        clientsWithOrders += current;
        metaClientsWithOrders += target;
      }
    }

    const monthlyData: { month: number; actual: number; goal: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const monthStart = `${currentYear}-${String(m).padStart(2, '0')}-01`;
      const monthEnd = new Date(currentYear, m, 0).toISOString().split('T')[0];

      const monthGoals = goals.filter((g) => {
        const gStart = g.startDate || '';
        const gEnd = g.endDate || '';
        return gStart <= monthEnd && gEnd >= monthStart;
      });

      let monthActual = 0;
      let monthGoal = 0;
      for (const g of monthGoals) {
        if (g.type === UserGoalType.SalesValue) {
          monthActual += Number(g.currentValue) || 0;
          monthGoal += Number(g.targetValue) || 0;
        }
      }
      monthlyData.push({ month: m, actual: monthActual, goal: monthGoal });
    }

    const byUser = Array.from(userMap.entries()).map(([uid, data]) => ({
      userId: uid,
      userName: data.name,
      accumulated: data.accumulated,
      meta: data.meta,
      attainment: data.meta > 0 ? (data.accumulated / data.meta) * 100 : 0,
      status:
        data.meta > 0
          ? data.accumulated / data.meta >= 1
            ? 'Top Performer'
            : 'Dentro da Meta'
          : 'Sem Meta',
    }));

    const globalAttainment = metaValue > 0 ? (totalValue / metaValue) * 100 : 0;
    const activeClientsPercent = 88;

    return {
      globalAttainment: Math.round(globalAttainment * 10) / 10,
      totalValue,
      metaValue,
      totalClients,
      metaClients,
      activeClientsPercent,
      productMix,
      metaProductMix,
      lineItems,
      metaLineItems,
      clientsWithOrders,
      metaClientsWithOrders,
      byMonth: monthlyData,
      byUser,
      goals: filteredGoals,
    };
  }
}
