import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { col, fn, Op, QueryTypes, Sequelize, WhereOptions } from 'sequelize';
import { AuthenticatedUserDto } from 'src/auth/dtos/authenticated-user.dto';
import { CompaniesService } from 'src/companies/companies.service';
import { OrdersPerEntityDto } from 'src/dashboard/dtos/orders-per-entity.dto';
import { RevenuePerEntityDto } from 'src/dashboard/dtos/revenue-per-entity.dto';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { EmailsService } from 'src/emails/emails.service';
import { UploadsService } from 'src/uploads/uploads.service';
import { UserRole } from 'src/users/enums/user-role.enum';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { UserHierarchiesService } from 'src/user-hierarchies/user-hierarchies.service';
import { UserGoalsService } from 'src/user-goals/user-goals.service';
import { VisitSource } from 'src/routes-visits/enums/visit-source.enum';
import { VisitRecordService } from 'src/routes-visits/visit-record.service';
import { UserGoalType } from 'src/user-goals/enums/user-goal-type.enum';
import { UserGoal } from 'src/user-goals/entities/user-goal.entity';
import { buildFilterQuery, buildSortQuery } from 'src/utils/query-utils';
import { buildFullTextSearchWhere } from 'src/utils/fulltext-utils';
import { logger } from 'src/utils/logger';
import { Readable } from 'stream';
import { Customer } from '../customers/customer.entity';
import { CustomerStatus } from '../customers/enums/customer-status.enum';
import { CustomersService } from '../customers/customers.service';
import { OrderItem } from '../order-items/order-item.entity';
import { PaymentCondition } from '../payment-conditions/payment-condition.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { PriceTableStatus } from '../price-tables/enums/price-table-status.enum';
import { PriceTable } from '../price-tables/price-table.entity';
import { ProductPhoto } from '../products/entities/product-photo.entity';
import { Product } from '../products/entities/product.entity';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto, CreateOrderItemDto } from './dtos/create-order.dto';
import { UpdateOrderAmountPaidDto } from './dtos/update-order-amount-paid.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import {
  CustomerProductHistoryDto,
  CustomerProductHistoryItemDto,
  CustomerProductHistoryQueryDto,
  DEFAULT_PURCHASE_WINDOW_DAYS,
} from './dtos/customer-product-history.dto';
import { OrderStatus } from './enums/order-status.enum';
import { Order } from './order.entity';
import { OrdersMapper } from './orders.mapper';
import { SubCategory } from '../sub-categories/sub-category.entity';
import { DashboardDTO } from 'src/dashboard/dtos/dashboard.dto';
import { parseMonthYearFilters } from './parse-month-year-filters';
import { Company } from 'src/companies/company.entity';
import { OrderSetup } from '../order-setups/order-setup.entity';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(EmailsService)
    private readonly emailsService: EmailsService,
    @Inject(OrdersMapper)
    private readonly ordersMapper: OrdersMapper,
    @Inject(ProductsService)
    private readonly productsService: ProductsService,
    @Inject(UploadsService)
    private readonly uploadsService: UploadsService,
    @Inject(UserHierarchiesService)
    private readonly userHierarchiesService: UserHierarchiesService,
    @Inject(UserGoalsService)
    private readonly userGoalsService: UserGoalsService,
    private readonly visitRecordService: VisitRecordService,
    @Inject('ORDER_REPOSITORY')
    private ordersRepository: typeof Order,
    @Inject('ORDER_ITEM_REPOSITORY')
    private orderItemsRepository: typeof OrderItem,
    @Inject('ORDER_SETUP_REPOSITORY')
    private orderSetupRepository: typeof OrderSetup,
  ) {}

  // REGION - Private Methods

  private async getPaymentConditionsForCustomer(
    companyId: number,
    customerId: number,
  ): Promise<PaymentCondition[]> {
    await this.companiesService.findOne(companyId);
    const customer = await this.customersService.findOne(companyId, customerId);
    return customer.paymentConditions;
  }

  private async getPaymentMethodsForCustomer(
    companyId: number,
    customerId: number,
  ): Promise<PaymentMethod[]> {
    await this.companiesService.findOne(companyId);
    const customer = await this.customersService.findOne(companyId, customerId);
    return customer.paymentMethods;
  }

  private async updateCustomerCreditLimitUsed(
    customer: Customer,
    amountPaid: number,
    oldAmountPaid?: number,
  ): Promise<void> {
    if (!oldAmountPaid) oldAmountPaid = 0;

    const creditLimitUsed = parseFloat(customer.creditLimitUsed.toString());
    const parsedOldAmountPaid = parseFloat(oldAmountPaid.toString());
    const parsedAmountPaid = parseFloat(amountPaid.toString());

    customer.creditLimitUsed = parseFloat(
      (creditLimitUsed + parsedOldAmountPaid - parsedAmountPaid).toFixed(2),
    );

    await customer.save();
  }

  private async updateStatusToInApproval(order: Order): Promise<void> {
    if (order.status == OrderStatus.OnBudget)
      order.status = OrderStatus.InApproval;
    else throw new BadRequestException('Pedido não está em orçamento');
  }

  private async updateStatusToApproved(order: Order): Promise<void> {
    const isFromInvoiced = order.status === OrderStatus.Invoiced;
    const isFromInApproval = order.status === OrderStatus.InApproval;

    if (!isFromInvoiced && !isFromInApproval) {
      throw new BadRequestException('Pedido não está em aprovação ou faturado');
    }

    const totalOrderValue = parseFloat(order.totalValue.toString());

    if (isFromInApproval) {
      const creditLimit = parseFloat(order.customer.creditLimit.toString());
      const creditLimitUsed = parseFloat(
        order.customer.creditLimitUsed.toString(),
      );

      if (creditLimit < creditLimitUsed + totalOrderValue)
        throw new BadRequestException(
          'Limite de crédito excedido, não será possível aprovar o pedido',
        );

      const company = await this.companiesService.findOne(order.companyId);

      order.orderItems.forEach((item) => {
        if (!company.allowOrdersWithoutStock) {
          if (item.quantity > item.product.stock)
            throw new BadRequestException(
              `Sem estoque para o produto de ID: ${item.productId}, não será possível aprovar o pedido`,
            );
          item.product.stock -= item.quantity;
          item.product.save();
        }
      });
      order.customer.creditLimitUsed =
        parseFloat(order.customer.creditLimitUsed.toString()) +
        parseFloat(totalOrderValue.toString());
      await order.customer.save();
    }

    order.status = OrderStatus.Approved;

    logger.info(
      `[ORDERS-SERVICE] Updating goals for approved order | orderId: ${order.id} | userId: ${order.responsibleUserId}`,
    );

    await this.updateGoalsForApprovedOrder(order);

    if (isFromInApproval) {
      try {
        await this.visitRecordService.createFromOrder(
          order.companyId,
          order.customerId,
          order.responsibleUserId,
          VisitSource.ORDER,
        );
      } catch (error) {
        logger.error(
          `[ORDERS-SERVICE] Failed to create visit record for order ${order.id}: ${error.message}`,
        );
      }
    }
  }

  private async updateGoalsForApprovedOrder(order: Order): Promise<void> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const userGoals = await this.userGoalsService.getUserGoalsByUser(
      order.companyId,
      order.responsibleUserId,
    );

    const activeGoals = userGoals.filter((goal) => {
      const startOk = !goal.startDate || goal.startDate <= todayStr;
      const endOk = !goal.endDate || goal.endDate >= todayStr;
      return startOk && endOk;
    });

    logger.info(
      `[ORDERS-SERVICE] Processing goals for approval | orderId: ${order.id} | activeGoalsCount: ${activeGoals.length}`,
    );

    for (const goal of activeGoals) {
      if (goal.type === UserGoalType.SalesValue) {
        const currentValue = parseFloat(goal.currentValue?.toString() || '0');
        const orderValue = parseFloat(order.totalValue.toString());
        goal.currentValue = parseFloat((currentValue + orderValue).toFixed(2));
        await goal.save();
        logger.info(
          `[ORDERS-SERVICE] SalesValue goal updated | goalId: ${goal.id} | addedValue: ${orderValue} | newValue: ${goal.currentValue}`,
        );
      } else if (goal.type === UserGoalType.ProductSales && order.orderItems) {
        const goalProductIds =
          goal.userGoalProducts?.map((p) => p.productId) || [];

        for (const orderItem of order.orderItems) {
          if (goalProductIds.includes(orderItem.productId)) {
            const goalProduct = goal.userGoalProducts?.find(
              (p) => p.productId === orderItem.productId,
            );
            if (goalProduct) {
              const currentValue = parseFloat(
                goal.currentValue?.toString() || '0',
              );
              goal.currentValue = parseFloat(
                (currentValue + orderItem.quantity).toFixed(2),
              );
              await goal.save();
              break;
            }
          }
        }
      } else if (goal.type === UserGoalType.LineItems && order.orderItems) {
        const currentValue = parseFloat(goal.currentValue?.toString() || '0');
        const lineItemsCount = order.orderItems.length;
        goal.currentValue = parseFloat(
          (currentValue + lineItemsCount).toFixed(2),
        );
        await goal.save();
      } else if (goal.type === UserGoalType.ClientsWithOrders) {
        const isFirstOrderForClient = await this.checkIsFirstOrderForClient(
          order,
          goal,
        );
        if (isFirstOrderForClient) {
          const currentValue = parseFloat(goal.currentValue?.toString() || '0');
          goal.currentValue = parseFloat((currentValue + 1).toFixed(2));
          await goal.save();
        }
      }
    }
  }

  private async checkIsFirstOrderForClient(
    order: Order,
    goal: UserGoal,
  ): Promise<boolean> {
    const orderCount = await this.ordersRepository.count({
      where: {
        companyId: order.companyId,
        responsibleUserId: order.responsibleUserId,
        customerId: order.customerId,
        status: {
          [Op.in]: [
            OrderStatus.Approved,
            OrderStatus.Invoiced,
            OrderStatus.Dispatched,
            OrderStatus.Delivered,
          ],
        },
      },
    });

    return orderCount === 0;
  }

  private async updateStatusToInvoiced(order: Order): Promise<void> {
    if (order.status == OrderStatus.Approved)
      order.status = OrderStatus.Invoiced;
    else throw new BadRequestException('Pedido não está aprovado');

    logger.info(
      `[ORDERS-SERVICE] Updating goals for invoiced order | orderId: ${order.id} | userId: ${order.responsibleUserId}`,
    );

    await this.updateGoalsForInvoicedOrder(order);
  }

  private async updateGoalsForInvoicedOrder(order: Order): Promise<void> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const userGoals = await this.userGoalsService.getUserGoalsByUser(
      order.companyId,
      order.responsibleUserId,
    );

    const activeGoals = userGoals.filter((goal) => {
      const startOk = !goal.startDate || goal.startDate <= todayStr;
      const endOk = !goal.endDate || goal.endDate >= todayStr;
      return startOk && endOk;
    });

    logger.info(
      `[ORDERS-SERVICE] Processing goals for invoiced | orderId: ${order.id} | activeGoalsCount: ${activeGoals.length}`,
    );

    for (const goal of activeGoals) {
      if (goal.type === UserGoalType.SalesValue) {
        const currentValue = parseFloat(goal.currentValue?.toString() || '0');
        const orderValue = parseFloat(order.totalValue.toString());
        goal.currentValue = parseFloat((currentValue + orderValue).toFixed(2));
        await goal.save();
        logger.info(
          `[ORDERS-SERVICE] SalesValue goal updated (invoiced) | goalId: ${goal.id} | addedValue: ${orderValue} | newValue: ${goal.currentValue}`,
        );
      } else if (goal.type === UserGoalType.ProductSales && order.orderItems) {
        const goalProductIds =
          goal.userGoalProducts?.map((p) => p.productId) || [];

        for (const orderItem of order.orderItems) {
          if (goalProductIds.includes(orderItem.productId)) {
            const goalProduct = goal.userGoalProducts?.find(
              (p) => p.productId === orderItem.productId,
            );
            if (goalProduct) {
              const currentValue = parseFloat(
                goal.currentValue?.toString() || '0',
              );
              goal.currentValue = parseFloat(
                (currentValue + orderItem.quantity).toFixed(2),
              );
              await goal.save();
              break;
            }
          }
        }
      } else if (goal.type === UserGoalType.LineItems && order.orderItems) {
        const currentValue = parseFloat(goal.currentValue?.toString() || '0');
        const lineItemsCount = order.orderItems.length;
        goal.currentValue = parseFloat(
          (currentValue + lineItemsCount).toFixed(2),
        );
        await goal.save();
      } else if (goal.type === UserGoalType.ClientsWithOrders) {
        const isFirstOrderForClient = await this.checkIsFirstOrderForClient(
          order,
          goal,
        );
        if (isFirstOrderForClient) {
          const currentValue = parseFloat(goal.currentValue?.toString() || '0');
          goal.currentValue = parseFloat((currentValue + 1).toFixed(2));
          await goal.save();
        }
      }
    }
  }

  private async updateStatusToDispatched(order: Order): Promise<void> {
    if (order.status == OrderStatus.Invoiced)
      order.status = OrderStatus.Dispatched;
    else throw new BadRequestException('Pedido não está faturado');
  }

  private async updateStatusToDelivered(order: Order): Promise<void> {
    if (order.status == OrderStatus.Dispatched)
      order.status = OrderStatus.Delivered;
    else throw new BadRequestException('Pedido não está despachado');
  }

  private async updateStatusToReturned(
    order: Order,
    returnReason: string,
  ): Promise<void> {
    if (!returnReason || returnReason === '')
      throw new BadRequestException('Motivo de retorno é obrigatório');

    if (order.status == OrderStatus.Delivered) {
      order.status = OrderStatus.Returned;
      order.returnReason = returnReason;
      order.orderItems.forEach((item) => {
        item.product.stock += item.quantity;
        item.product.save();
      });

      await this.removeGoalsForOrder(order);
    } else throw new BadRequestException('Pedido não está entregue');
  }

  private async removeGoalsForOrder(order: Order): Promise<void> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const userGoals = await this.userGoalsService.getUserGoalsByUser(
      order.companyId,
      order.responsibleUserId,
    );

    const activeGoals = userGoals.filter((goal) => {
      const startOk = !goal.startDate || goal.startDate <= todayStr;
      const endOk = !goal.endDate || goal.endDate >= todayStr;
      return startOk && endOk;
    });

    for (const goal of activeGoals) {
      if (goal.type === UserGoalType.SalesValue) {
        const currentValue = parseFloat(goal.currentValue?.toString() || '0');
        const orderValue = parseFloat(order.totalValue.toString());
        goal.currentValue = parseFloat((currentValue - orderValue).toFixed(2));
        if (goal.currentValue < 0) goal.currentValue = 0;
        await goal.save();
      } else if (goal.type === UserGoalType.ProductSales && order.orderItems) {
        const goalProductIds =
          goal.userGoalProducts?.map((p) => p.productId) || [];

        for (const orderItem of order.orderItems) {
          if (goalProductIds.includes(orderItem.productId)) {
            const goalProduct = goal.userGoalProducts?.find(
              (p) => p.productId === orderItem.productId,
            );
            if (goalProduct) {
              const currentValue = parseFloat(
                goal.currentValue?.toString() || '0',
              );
              goal.currentValue = parseFloat(
                (currentValue - orderItem.quantity).toFixed(2),
              );
              if (goal.currentValue < 0) goal.currentValue = 0;
              await goal.save();
              break;
            }
          }
        }
      } else if (goal.type === UserGoalType.LineItems && order.orderItems) {
        const currentValue = parseFloat(goal.currentValue?.toString() || '0');
        const lineItemsCount = order.orderItems.length;
        goal.currentValue = parseFloat(
          (currentValue - lineItemsCount).toFixed(2),
        );
        if (goal.currentValue < 0) goal.currentValue = 0;
        await goal.save();
      } else if (goal.type === UserGoalType.ClientsWithOrders) {
        const hasOtherOrders = await this.checkHasOtherValidOrders(order);
        if (hasOtherOrders) {
          const currentValue = parseFloat(goal.currentValue?.toString() || '0');
          goal.currentValue = parseFloat((currentValue - 1).toFixed(2));
          if (goal.currentValue < 0) goal.currentValue = 0;
          await goal.save();
        }
      }
    }
  }

  private async checkHasOtherValidOrders(order: Order): Promise<boolean> {
    const orderCount = await this.ordersRepository.count({
      where: {
        companyId: order.companyId,
        responsibleUserId: order.responsibleUserId,
        customerId: order.customerId,
        id: { [Op.ne]: order.id },
        status: {
          [Op.in]: [
            OrderStatus.Approved,
            OrderStatus.Invoiced,
            OrderStatus.Dispatched,
            OrderStatus.Delivered,
          ],
        },
      },
    });

    return orderCount > 0;
  }

  private async updateStatusToCanceled(
    order: Order,
    cancelReason?: string,
  ): Promise<void> {
    if (
      order.status === OrderStatus.OnBudget ||
      order.status === OrderStatus.InApproval
    ) {
      order.status = OrderStatus.Canceled;
      order.cancelReason = cancelReason;
      logger.info(
        `[ORDERS-SERVICE] Order canceled - removing goals | orderId: ${
          order.id
        } | reason: ${cancelReason || 'N/A'}`,
      );
      await this.removeGoalsForOrder(order);
    } else
      throw new BadRequestException(
        'Pedido não está em orçamento ou em aprovação',
      );
  }

  private async updateStatusToBlocked(
    order: Order,
    blockReason?: string,
  ): Promise<void> {
    if (
      order.status === OrderStatus.OnBudget ||
      order.status === OrderStatus.InApproval
    ) {
      order.status = OrderStatus.Blocked;
      order.blockReason = blockReason;
      logger.info(
        `[ORDERS-SERVICE] Order blocked - removing goals | orderId: ${
          order.id
        } | reason: ${blockReason || 'N/A'}`,
      );
      await this.removeGoalsForOrder(order);
    } else
      throw new BadRequestException(
        'Pedido não está em orçamento ou em aprovação',
      );
  }

  private async sendEmailToCustomerClient(order: Order, user: User) {
    await this.emailsService.sendEmail(
      user.email,
      'Pedido em Aprovação - SELLOU',
      'customer-client-order',
      {
        customerName: user.name,
        orderId: order.id,
        orderDate: order.createdAt.toLocaleDateString('pt-BR'),
        totalValue: order.totalValue,
      },
    );
  }

  async validateCreateOrder(
    companyId: number,
    customerId: number,
    paymentConditionId: number,
    paymentMethodId: number,
    orderDiscount: number | undefined,
    items: CreateOrderItemDto[] | OrderItem[],
    user: User,
    programmedDate?: string,
  ): Promise<void> {
    await this.validateCustomerPermissions(user, customerId);
    await this.validatePaymentConditions(
      companyId,
      customerId,
      paymentConditionId,
    );
    await this.validatePaymentMethods(companyId, customerId, paymentMethodId);
    await this.validateDiscount(orderDiscount, items, companyId);
    if (programmedDate) {
      await this.validateProgrammedDate(companyId, programmedDate);
    }
  }

  private async resolveResponsibleUserIds(
    companyId: number,
    primaryUserId: number,
    extraUserIds: number[] = [],
  ): Promise<number[]> {
    const companyUserIds = await this.usersService.findCompanyUserIds(
      companyId,
    );
    const validExtraIds = extraUserIds.filter((id) =>
      companyUserIds.includes(id),
    );
    return Array.from(new Set([primaryUserId, ...validExtraIds]));
  }

  private async validateProgrammedDate(
    companyId: number,
    programmedDate: string,
  ): Promise<void> {
    const orderSetup = await this.orderSetupRepository.findOne({
      where: { companyId },
    });

    if (!orderSetup) {
      throw new BadRequestException(
        'Configuração de pedido não encontrada para esta empresa. Configure os limites de dias primeiro.',
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse YYYY-MM-DD string directly without timezone issues
    const [year, month, day] = programmedDate.split('-').map(Number);
    const programmed = new Date(year, month - 1, day);
    programmed.setHours(0, 0, 0, 0);

    const diffTime = programmed.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < orderSetup.minDays) {
      throw new BadRequestException(
        `A data programada deve ser no mínimo ${orderSetup.minDays} dias a partir de hoje`,
      );
    }

    if (diffDays > orderSetup.maxDays) {
      throw new BadRequestException(
        `A data programada deve ser no máximo ${orderSetup.maxDays} dias a partir de hoje`,
      );
    }
  }

  private async validateCustomerPermissions(
    user: User,
    customerId: number,
  ): Promise<void> {
    if (
      user.role === UserRole.CustomerClient &&
      user.customerId !== customerId
    ) {
      throw new BadRequestException(
        'Usuário não tem permissão para criar pedido para um cliente diferente do que está vinculado',
      );
    }
  }

  private async validatePaymentConditions(
    companyId: number,
    customerId: number,
    paymentConditionId: number,
  ): Promise<void> {
    if (paymentConditionId) {
      const paymentConditions = await this.getPaymentConditionsForCustomer(
        companyId,
        customerId,
      );
      const isValidPaymentCondition = paymentConditions.some(
        (condition) => condition.id === paymentConditionId,
      );

      if (!isValidPaymentCondition) {
        throw new BadRequestException(
          'Condição de pagamento não está cadastrada para o cliente selecionado',
        );
      }
    }
  }

  private async validatePaymentMethods(
    companyId: number,
    customerId: number,
    paymentMethodId: number,
  ): Promise<void> {
    if (paymentMethodId) {
      const paymentMethods = await this.getPaymentMethodsForCustomer(
        companyId,
        customerId,
      );
      const isValidPaymentMethod = paymentMethods.some(
        (method) => method.id === paymentMethodId,
      );

      if (!isValidPaymentMethod) {
        throw new BadRequestException(
          'Método de pagamento não está cadastrada para o cliente selecionado',
        );
      }
    }
  }

  private async validateDiscount(
    orderDiscount: number | undefined,
    items: CreateOrderItemDto[] | OrderItem[],
    companyId: number,
  ): Promise<void> {
    if (orderDiscount !== undefined) {
      if (parseFloat(orderDiscount.toString()) < 0) {
        throw new BadRequestException(
          'Desconto do pedido não pode ser negativo',
        );
      }
    }

    let totalOrderValue = 0;
    for (const item of items) {
      const product = await this.productsService.findOne(
        companyId,
        item.productId,
      );
      totalOrderValue += item.quantity * product.price;
    }

    let totalItemDiscounts = 0;
    for (const item of items) {
      if (item.discount) {
        if (parseFloat(item.discount.toString()) < 0) {
          throw new BadRequestException(
            'Desconto do item não pode ser negativo',
          );
        }

        const product = await this.productsService.findOne(
          companyId,
          item.productId,
        );
        const itemTotal = item.quantity * product.price;

        if (parseFloat(item.discount.toString()) > itemTotal) {
          throw new BadRequestException(
            `Desconto não pode ser maior que o total do item (Produto ID: ${item.productId})`,
          );
        }

        totalItemDiscounts += parseFloat(item.discount.toString());
      }
    }

    const orderDiscountValue = orderDiscount
      ? parseFloat(orderDiscount.toString())
      : 0;
    if (totalItemDiscounts + orderDiscountValue > totalOrderValue) {
      throw new BadRequestException(
        'O total de descontos não pode exceder o valor total do pedido',
      );
    }
  }

  private rewriteFilterQuery(filterQuery: any): any {
    const newFilterQuery = { ...filterQuery };

    const handleFilter = (key: string, field: string) => {
      if (newFilterQuery[key]) {
        let whereClause = {
          [field]: newFilterQuery[key],
        };

        const filterObject = newFilterQuery[key] as Record<string, any>;

        if (filterObject['iLike']) {
          whereClause = {
            [field]: { [Op.iLike]: filterObject['iLike'] },
          };
        }

        delete newFilterQuery[key];
        newFilterQuery[`${key}Filter`] = whereClause;
      }
    };

    handleFilter('customer', 'corporateName');
    handleFilter('paymentCondition', 'name');
    handleFilter('paymentMethod', 'name');
    handleFilter('responsibleUser', 'name');

    return newFilterQuery;
  }

  async calculateTotalOrderValue(customer: Customer, orderId: number) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    const orderItems = await this.orderItemsRepository.findAll({
      where: { orderId: orderId },
      include: [
        {
          model: Order,
        },
        {
          model: Product,
          include: [PriceTable],
        },
      ],
    });

    if (!orderItems || orderItems.length === 0) return 0;

    const subtotal = orderItems.reduce((sum, item) => {
      const product = item.product;
      if (!product) return sum;

      const itemPrice = product.price;

      const itemTotal = item.quantity * itemPrice;
      return sum + itemTotal;
    }, 0);

    const itemDiscounts = orderItems.reduce((sum, item) => {
      return sum + parseFloat(item.discount?.toString() || '0');
    }, 0);

    const orderDiscount = parseFloat(order.discount?.toString() || '0');

    const totalValue = subtotal - itemDiscounts - orderDiscount;

    return Math.max(0, totalValue);
  }

  private async updateOrderProductUrls(order: Order): Promise<Order> {
    for (const item of order.orderItems) {
      const product = item.product;
      if (product && product.photos && product.photos.length > 0) {
        for (const photo of product.photos) {
          if (!photo.url) continue;

          const lastSlashIndex = photo.url.lastIndexOf('/');
          const filename = photo.url.substring(lastSlashIndex + 1);
          photo.url = await this.uploadsService.getPresignedGetUrl(filename);
        }
      }
    }
    return order;
  }

  // ENDREGION - Private Methods

  getModel() {
    return this.ordersRepository;
  }

  async createOrder(
    companyId: number,
    createOrderDto: CreateOrderDto,
    authenticatedUserDto: AuthenticatedUserDto,
  ): Promise<Order> {
    logger.info(
      `[ORDERS-SERVICE] Creating order | companyId: ${companyId} | userId: ${authenticatedUserDto.id} | customerId: ${createOrderDto.customerId}`,
    );

    const customer = await this.customersService.findOne(
      companyId,
      createOrderDto.customerId,
    );

    if (customer.status !== CustomerStatus.Active) {
      logger.warn(
        `[ORDERS-SERVICE] Order creation blocked - inactive customer | customerId: ${createOrderDto.customerId} | status: ${customer.status}`,
      );
      throw new BadRequestException(
        'Cliente inativo ou inadimplente. Não é possível criar pedidos para este cliente.',
      );
    }

    const user = await this.usersService.findOneWithNoRole(
      authenticatedUserDto.id,
    );

    logger.info(
      `[ORDERS-SERVICE] Validating order data | companyId: ${companyId} | itemsCount: ${
        createOrderDto.items?.length || 0
      }`,
    );

    await this.validateCreateOrder(
      companyId,
      createOrderDto.customerId,
      createOrderDto.paymentConditionId,
      createOrderDto.paymentMethodId,
      createOrderDto.discount,
      createOrderDto.items,
      user,
      createOrderDto.programmedDate,
    );

    logger.info(
      `[ORDERS-SERVICE] Mapping DTO to order model | companyId: ${companyId}`,
    );

    const { items, ...orderData } = createOrderDto;
    const orderMapped: Partial<Order> =
      await this.ordersMapper.createOrderDtoToOrder(
        orderData,
        authenticatedUserDto.id,
        authenticatedUserDto.role === UserRole.CustomerClient,
      );

    const manager = await this.userHierarchiesService.getManagerForUser(
      orderMapped.responsibleUserId,
      companyId,
    );

    logger.info(
      `[ORDERS-SERVICE] Persisting order to database | companyId: ${companyId}`,
    );

    const order = await this.ordersRepository.create({
      ...orderMapped.dataValues,
      companyId,
      managerId: manager?.id,
    });

    if (items && items.length > 0) {
      logger.info(
        `[ORDERS-SERVICE] Creating order items | orderId: ${order.id} | itemsCount: ${items.length}`,
      );
      const orderItems = items.map((item) => ({
        ...item,
        orderId: order.id,
      }));
      await this.orderItemsRepository.bulkCreate(orderItems);
    }

    const responsibleUserIds = await this.resolveResponsibleUserIds(
      companyId,
      authenticatedUserDto.id,
      createOrderDto.responsibleUserIds,
    );
    await order.$set('responsibleUsers', responsibleUserIds);

    const totalValue = await this.calculateTotalOrderValue(customer, order.id);

    await order.update({
      totalValue,
    });

    const orderSaved = await this.findOne(companyId, order.id);

    logger.info(
      `[ORDERS-SERVICE] Order created successfully | orderId: ${order.id} | totalValue: ${totalValue} | companyId: ${companyId}`,
    );

    if (orderSaved.isCustomerClientOrder)
      this.sendEmailToCustomerClient(orderSaved, user);

    return orderSaved;
  }

  async findOne(companyId: number, id: number): Promise<Order> {
    await this.companiesService.findOne(companyId);

    const order = await this.ordersRepository.findOne({
      where: { id, companyId },
      include: [
        Customer,
        PaymentCondition,
        PaymentMethod,
        {
          model: User,
          as: 'responsibleUser',
        },
        {
          model: User,
          as: 'responsibleUsers',
          attributes: ['id', 'name'],
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              include: [ProductPhoto],
            },
          ],
        },
      ],
    });

    if (!order) throw new NotFoundException('Pedido não encontrado');

    return await this.updateOrderProductUrls(order);
  }

  private buildDateWhereClause(filter: DashboardDTO): WhereOptions {
    return parseMonthYearFilters(filter).dateWhere;
  }

  private buildDateWhereClauseForCustomer(filter: DashboardDTO): WhereOptions {
    return parseMonthYearFilters(filter).dateWhere;
  }

  async findAll(
    companyId: number,
    findAllDto: BaseFindAllDataDto,
  ): Promise<{
    data: Order[];
    metadata: { page: number; limit: number; total: number };
  }> {
    try {
      const company = await this.companiesService.findOne(companyId);
      const { page = 1, limit = 10, sort, filters, query } = findAllDto;

      const parsedFilters = filters ? JSON.parse(filters) : {};
      const parsedSort = sort ? JSON.parse(sort) : { id: 'desc' };

      const year = parsedFilters.year as number | undefined;
      const month = parsedFilters.month as number | undefined;

      const { year: _year, month: _month, ...restFilters } = parsedFilters;
      const cleanedFilters = restFilters;

      const processedFilters = this.rewriteFilterQuery(
        buildFilterQuery(cleanedFilters, Order),
      );
      const sortQuery = buildSortQuery(parsedSort);

      const filterQuery: any = { ...processedFilters };

      const customerFilterCondition = processedFilters.customerFilter;
      const paymentConditionFilterCondition =
        processedFilters.paymentConditionFilter;
      const responsibleUserFilterCondition =
        processedFilters.responsibleUserFilter;
      const paymentMethodFilterCondition = processedFilters.paymentMethodFilter;

      if (filterQuery.customerFilter) delete filterQuery.customerFilter;
      if (filterQuery.paymentConditionFilter)
        delete filterQuery.paymentConditionFilter;
      if (filterQuery.paymentMethodFilter)
        delete filterQuery.paymentMethodFilter;
      if (filterQuery.responsibleUserFilter)
        delete filterQuery.responsibleUserFilter;

      const mainWhere: any[] = [{ companyId: company.id }];

      if (year && month && month > 0) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        mainWhere.push({
          createdAt: { [Op.between]: [startDate, endDate] },
        });
      } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        mainWhere.push({
          createdAt: { [Op.between]: [startDate, endDate] },
        });
      }

      if (query) {
        mainWhere.push({
          [Op.or]: [
            buildFullTextSearchWhere(['observation'], query),
            Sequelize.where(Sequelize.cast(Sequelize.col('Order.id'), 'TEXT'), {
              [Op.iLike]: `%${query}%`,
            }),
            buildFullTextSearchWhere(
              ['corporateName', 'fantasyName'],
              query,
              'Customer',
            ),
            buildFullTextSearchWhere(['name'], query, 'responsibleUser'),
            buildFullTextSearchWhere(['name'], query, 'paymentCondition'),
          ],
        });
      }

      const includes = [
        {
          model: Customer,
          required: !!customerFilterCondition || !!query,
          where: customerFilterCondition,
        },
        {
          model: User,
          as: 'responsibleUser',
          select: ['name'],
          required: !!query,
          where: responsibleUserFilterCondition,
        },
        {
          model: User,
          as: 'responsibleUsers',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: PaymentCondition,
          as: 'paymentCondition',
          select: ['name'],
          required: !!query,
          where: paymentConditionFilterCondition,
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          select: ['name'],
          where: paymentMethodFilterCondition,
        },
        {
          model: PaymentMethod,
          required: true,
        },
        {
          model: OrderItem,
          required: false,
          include: [
            {
              model: Product,
              required: false,
              include: [ProductPhoto],
            },
          ],
        },
      ];

      const whereClause = {
        [Op.and]: [
          ...mainWhere,
          ...Object.entries(filterQuery).map(([key, value]) => ({
            [key]: value,
          })),
        ],
      };

      const total = await this.ordersRepository.count({
        where: whereClause,
        distinct: true,
        include: includes,
      });

      const data = await this.ordersRepository.findAll({
        where: whereClause,
        order: sortQuery,
        offset: (page - 1) * limit,
        include: includes,
        limit,
      });

      for (const order of data) {
        await this.updateOrderProductUrls(order);
      }

      return {
        data,
        metadata: { page, limit, total },
      };
    } catch (error) {
      logger.error('Erro ao buscar pedidos:', error);
      throw new InternalServerErrorException(
        `Erro ao buscar: ${error.message}`,
      );
    }
  }

  async updateOrder(
    companyId: number,
    orderId: number,
    updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    await this.companiesService.findOne(companyId);
    const order = await this.findOne(companyId, orderId);
    const customer = await this.customersService.findOne(
      companyId,
      updateOrderDto.customerId ?? order.customerId,
    );
    const user = await this.usersService.findOneWithNoRole(
      order.responsibleUserId,
    );

    await this.validateCreateOrder(
      companyId,
      updateOrderDto.customerId ?? order.customerId,
      updateOrderDto.paymentConditionId ?? order.paymentConditionId,
      updateOrderDto.paymentMethodId ?? order.paymentMethodId,
      updateOrderDto.discount ?? order.discount,
      updateOrderDto.items ?? order.orderItems,
      user,
      updateOrderDto.programmedDate,
    );

    const paymentConditions = await this.getPaymentConditionsForCustomer(
      companyId,
      updateOrderDto.customerId ?? order.customerId,
    );

    const paymentConditionId =
      updateOrderDto.paymentConditionId ?? order.paymentConditionId;
    const isValidPaymentCondition = paymentConditions.some(
      (condition) => condition.id === paymentConditionId,
    );

    if (!isValidPaymentCondition)
      throw new BadRequestException(
        'Condição de pagamento não está cadastrada para o cliente selecionado',
      );

    const paymentMethods = await this.getPaymentMethodsForCustomer(
      companyId,
      updateOrderDto.customerId ?? order.customerId,
    );

    const paymentMethodId =
      updateOrderDto.paymentMethodId ?? order.paymentMethodId;
    const isValidPaymentMethod = paymentMethods.some(
      (method) => method.id === paymentMethodId,
    );

    if (!isValidPaymentMethod)
      throw new BadRequestException(
        'Método de pagamento não está cadastrada para o cliente selecionado',
      );

    const { items, ...orderData } = updateOrderDto;
    const orderMapped: Partial<Order> =
      await this.ordersMapper.updateOrderDtoToOrder(order, orderData);

    await order.update({
      ...orderMapped.dataValues,
      companyId,
    });

    if (items && items.length > 0) {
      await this.orderItemsRepository.destroy({ where: { orderId: order.id } });
      const orderItems = items.map((item) => ({
        ...item,
        orderId: order.id,
      }));
      await this.orderItemsRepository.bulkCreate(orderItems);
    }

    if (updateOrderDto.responsibleUserIds) {
      const responsibleUserIds = await this.resolveResponsibleUserIds(
        companyId,
        order.responsibleUserId,
        updateOrderDto.responsibleUserIds,
      );
      await order.$set('responsibleUsers', responsibleUserIds);
    }

    const totalValue = await this.calculateTotalOrderValue(customer, order.id);

    await order.update({
      totalValue,
    });

    const orderSaved = await this.findOne(companyId, order.id);

    return orderSaved;
  }

  async deleteOrder(companyId: number, id: number): Promise<void> {
    logger.info(
      `[ORDERS-SERVICE] Deleting order | orderId: ${id} | companyId: ${companyId}`,
    );

    await this.companiesService.findOne(companyId);

    const order = await this.findOne(companyId, id);

    logger.info(
      `[ORDERS-SERVICE] Order found for deletion | orderId: ${id} | status: ${order.status} | totalValue: ${order.totalValue}`,
    );

    const customer = await this.customersService.findOne(
      companyId,
      order.customerId,
    );

    if (
      order.status !== OrderStatus.OnBudget &&
      order.status !== OrderStatus.InApproval
    ) {
      logger.info(
        `[ORDERS-SERVICE] Reverting customer credit limit | customerId: ${customer.id} | amount: ${order.totalValue}`,
      );
      await this.updateCustomerCreditLimitUsed(customer, order.totalValue);
    }

    logger.info(`[ORDERS-SERVICE] Deleting order items | orderId: ${id}`);

    await this.orderItemsRepository.destroy({ where: { orderId: order.id } });
    await order.destroy();

    logger.info(
      `[ORDERS-SERVICE] Order deleted successfully | orderId: ${id} | companyId: ${companyId}`,
    );
  }

  async updateStatus(
    companyId: number,
    orderId: number,
    updateStatusDto: UpdateOrderStatusDto,
    userId: number,
  ): Promise<{ originalOrder: Order; newOrder?: Order }> {
    logger.info(
      `[ORDERS-SERVICE] Updating order status | orderId: ${orderId} | companyId: ${companyId} | newStatus: ${updateStatusDto.status} | userId: ${userId}`,
    );

    await this.companiesService.findOne(companyId);
    let order = await this.findOne(companyId, orderId);
    const oldStatus = order.status;

    logger.info(
      `[ORDERS-SERVICE] Current order status | orderId: ${orderId} | oldStatus: ${oldStatus}`,
    );

    let newOrder: Order | undefined;

    if (updateStatusDto.status === OrderStatus.InApproval)
      await this.updateStatusToInApproval(order);
    else if (updateStatusDto.status === OrderStatus.Approved)
      await this.updateStatusToApproved(order);
    else if (updateStatusDto.status === OrderStatus.Invoiced) {
      if (
        updateStatusDto.partialInvoicing &&
        updateStatusDto.partialInvoicing.length > 0
      ) {
        logger.info(
          `[ORDERS-SERVICE] Processing partial invoicing | orderId: ${orderId} | itemsCount: ${updateStatusDto.partialInvoicing.length}`,
        );
        const result = await this.handlePartialInvoicing(
          order,
          updateStatusDto.partialInvoicing,
          userId,
        );
        order = result.originalOrder;
        newOrder = result.newOrder;
      } else {
        await this.updateStatusToInvoiced(order);
      }
    } else if (updateStatusDto.status === OrderStatus.Dispatched)
      await this.updateStatusToDispatched(order);
    else if (updateStatusDto.status === OrderStatus.Delivered)
      await this.updateStatusToDelivered(order);
    else if (updateStatusDto.status === OrderStatus.Returned)
      await this.updateStatusToReturned(order, updateStatusDto.returnReason);
    else if (updateStatusDto.status === OrderStatus.Canceled)
      await this.updateStatusToCanceled(order, updateStatusDto.cancelReason);
    else if (updateStatusDto.status === OrderStatus.Blocked)
      await this.updateStatusToBlocked(order, updateStatusDto.blockReason);
    else throw new BadRequestException('Status inválido');

    logger.info(
      `[ORDERS-SERVICE] Order status updated | orderId: ${orderId} | oldStatus: ${oldStatus} | newStatus: ${order.status}`,
    );

    if (oldStatus !== order.status) {
      const history = order.statusHistory ? [...order.statusHistory] : [];
      history.push({
        oldStatus,
        newStatus: order.status,
        userId,
        createdAt: new Date(),
      });
      order.statusHistory = history;
    }

    await order.save();
    return { originalOrder: order, newOrder };
  }

  async splitOrder(
    companyId: number,
    orderId: number,
    splitData: { productId: number; quantity: number }[],
    userId: number,
  ): Promise<{ originalOrder: Order; newOrder: Order }> {
    const order = await this.findOne(companyId, orderId);
    const orderItems = await this.orderItemsRepository.findAll({
      where: { orderId: order.id },
      include: [Product],
    });

    const originalSubtotal = orderItems.reduce(
      (acc, item) => acc + item.quantity * item.product.price,
      0,
    );
    let movedSubtotal = 0;

    const itemsToKeep = splitData;
    const itemsToMove: {
      productId: number;
      quantity: number;
      discount: number;
    }[] = [];

    for (const item of orderItems) {
      const keepItem = itemsToKeep.find((i) => i.productId === item.productId);
      if (keepItem) {
        if (keepItem.quantity < item.quantity) {
          const originalDiscount = parseFloat(item.discount?.toString() || '0');
          const unitDiscount = originalDiscount / item.quantity;
          const keepDiscount = unitDiscount * keepItem.quantity;
          const moveDiscount = originalDiscount - keepDiscount;

          movedSubtotal +=
            (item.quantity - keepItem.quantity) * item.product.price;
          itemsToMove.push({
            productId: item.productId,
            quantity: item.quantity - keepItem.quantity,
            discount: moveDiscount,
          });

          if (keepItem.quantity > 0) {
            await this.orderItemsRepository.update(
              { quantity: keepItem.quantity, discount: keepDiscount },
              { where: { id: item.id } },
            );
          } else {
            await this.orderItemsRepository.destroy({
              where: { id: item.id },
            });
          }
        } else if (keepItem.quantity === item.quantity) {
          // Full quantity kept, no change needed
        } else {
          throw new BadRequestException(
            `Quantidade maior que a disponível para o produto ${item.productId}`,
          );
        }
      } else {
        movedSubtotal += item.quantity * item.product.price;
        itemsToMove.push({
          productId: item.productId,
          quantity: item.quantity,
          discount: parseFloat(item.discount?.toString() || '0'),
        });
        await this.orderItemsRepository.destroy({
          where: { id: item.id },
        });
      }
    }

    if (itemsToMove.length === 0) {
      throw new BadRequestException(
        'Nenhum produto restante para criar novo pedido',
      );
    }

    const newOrder = await this.createOrderFromSplit(
      order,
      itemsToMove,
      userId,
      originalSubtotal,
      movedSubtotal,
    );
    await this.recalculateOrderTotal(order);
    await order.reload({ include: [OrderItem] });

    return { originalOrder: order, newOrder };
  }

  private async handlePartialInvoicing(
    order: Order,
    partialInvoicing: { productId: number; quantity: number }[],
    userId: number,
  ): Promise<{ originalOrder: Order; newOrder?: Order }> {
    const orderItems = await this.orderItemsRepository.findAll({
      where: { orderId: order.id },
      include: [Product],
    });

    const originalSubtotal = orderItems.reduce(
      (acc, item) => acc + item.quantity * item.product.price,
      0,
    );
    let movedSubtotal = 0;

    const itemsToInvoice = partialInvoicing;
    const itemsNotInvoiced: {
      productId: number;
      quantity: number;
      discount: number;
    }[] = [];

    const processedProductIds = new Set<number>();

    for (const item of orderItems) {
      const invoicedItem = itemsToInvoice.find(
        (i) => i.productId === item.productId,
      );
      processedProductIds.add(item.productId);

      if (invoicedItem) {
        if (invoicedItem.quantity > item.quantity) {
          throw new BadRequestException(
            `Quantidade maior que a disponível para o produto ${item.productId}`,
          );
        }

        const originalDiscount = parseFloat(item.discount?.toString() || '0');
        const unitDiscount = originalDiscount / item.quantity;
        const invoicedDiscount = unitDiscount * invoicedItem.quantity;
        const remainingDiscount = originalDiscount - invoicedDiscount;

        if (invoicedItem.quantity < item.quantity) {
          movedSubtotal +=
            (item.quantity - invoicedItem.quantity) * item.product.price;
          itemsNotInvoiced.push({
            productId: item.productId,
            quantity: item.quantity - invoicedItem.quantity,
            discount: remainingDiscount,
          });
        }

        if (invoicedItem.quantity > 0) {
          await this.orderItemsRepository.update(
            { quantity: invoicedItem.quantity, discount: invoicedDiscount },
            { where: { id: item.id } },
          );
        } else {
          await this.orderItemsRepository.destroy({
            where: { id: item.id },
          });
        }
      } else {
        movedSubtotal += item.quantity * item.product.price;
        itemsNotInvoiced.push({
          productId: item.productId,
          quantity: item.quantity,
          discount: parseFloat(item.discount?.toString() || '0'),
        });
        await this.orderItemsRepository.destroy({
          where: { id: item.id },
        });
      }
    }

    for (const invoicedItem of itemsToInvoice) {
      if (!processedProductIds.has(invoicedItem.productId)) {
        throw new BadRequestException(
          `Produto ${invoicedItem.productId} não encontrado no pedido`,
        );
      }
    }

    if (itemsNotInvoiced.length > 0) {
      await this.createOrderFromSplit(
        order,
        itemsNotInvoiced,
        userId,
        originalSubtotal,
        movedSubtotal,
      );
    }

    await this.recalculateOrderTotal(order);
    await order.reload({ include: [OrderItem] });
    await this.updateStatusToInvoiced(order);

    return { originalOrder: order };
  }

  private async recalculateOrderTotal(order: Order): Promise<void> {
    const totalValue = await this.calculateTotalOrderValue(
      order.customer,
      order.id,
    );
    order.totalValue = totalValue;
    await order.save();
  }

  private async createOrderFromSplit(
    originalOrder: Order,
    items: { productId: number; quantity: number; discount: number }[],
    userId: number,
    originalSubtotal: number,
    movedSubtotal: number,
  ): Promise<Order> {
    // Split the order-level discount proportionally
    const originalOrderDiscount = parseFloat(
      originalOrder.discount?.toString() || '0',
    );
    let newOrderDiscount = 0;

    if (originalSubtotal > 0) {
      newOrderDiscount =
        (movedSubtotal / originalSubtotal) * originalOrderDiscount;
    }

    const remainingOrderDiscount = originalOrderDiscount - newOrderDiscount;
    await originalOrder.update({ discount: remainingOrderDiscount });

    const newOrder = await this.ordersRepository.create({
      companyId: originalOrder.companyId,
      customerId: originalOrder.customerId,
      paymentConditionId: originalOrder.paymentConditionId,
      paymentMethodId: originalOrder.paymentMethodId,
      status: originalOrder.status,
      observation: `Pedido criado por fatiamento do pedido #${originalOrder.id}`,
      discount: newOrderDiscount,
      amountPaid: 0,
      totalValue: 0,
      responsibleUserId: userId,
      programmedDate: originalOrder.programmedDate,
    });

    for (const item of items) {
      await this.orderItemsRepository.create({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        discount: item.discount,
      });
    }

    const responsibleIds = originalOrder.responsibleUsers?.map((u) => u.id) || [
      originalOrder.responsibleUserId,
    ];
    await newOrder.$set('responsibleUsers', responsibleIds);

    const totalValue = await this.calculateTotalOrderValue(
      originalOrder.customer,
      newOrder.id,
    );
    await newOrder.update({ totalValue });
    await newOrder.reload();
    return newOrder;
  }

  async updateAmountPaid(
    companyId: number,
    orderId: number,
    updateAmountPaidDto: UpdateOrderAmountPaidDto,
  ): Promise<Order> {
    const order = await this.findOne(companyId, orderId);

    if (
      order.status === OrderStatus.OnBudget ||
      order.status === OrderStatus.InApproval
    )
      throw new BadRequestException(
        'Pedido não está aprovado, não é possível alterar o valor pago',
      );

    const oldAmountPaid = order.amountPaid;

    if (updateAmountPaidDto.amountPaid < 0)
      throw new BadRequestException('Valor de pagamento inválido');
    else if (updateAmountPaidDto.amountPaid > order.totalValue)
      throw new BadRequestException(
        'Valor de pagamento excede o total do pedido',
      );

    const orderMapped: Partial<Order> =
      await this.ordersMapper.updateAmountPaidDtoToOrder(
        order,
        updateAmountPaidDto,
      );

    await order.update({
      ...orderMapped.dataValues,
      companyId,
    });

    await this.updateCustomerCreditLimitUsed(
      order.customer,
      updateAmountPaidDto.amountPaid,
      oldAmountPaid,
    );

    const orderSaved = await this.findOne(companyId, order.id);

    return orderSaved;
  }

  async findCustomerClientOrders(
    companyId: number,
    customerId: number,
    customerClientId: number,
    findAllDto: BaseFindAllDataDto,
  ): Promise<{
    data: Order[];
    metadata: { page: number; limit: number; total: number };
  }> {
    await this.companiesService.findOne(companyId);
    await this.customersService.findOne(companyId, customerId);
    await this.usersService.findOneCustomerClient(
      companyId,
      customerId,
      customerClientId,
    );

    const { page = 1, limit = 10, sort, filters, query } = findAllDto;

    const parsedFilters = filters ? JSON.parse(filters) : {};
    const parsedSort = sort ? JSON.parse(sort) : {};

    const filterQuery = buildFilterQuery(parsedFilters);
    const sortQuery = buildSortQuery(parsedSort);

    if (query) {
      filterQuery[Op.or] = [
        buildFullTextSearchWhere(['observation'], query),
        Sequelize.where(Sequelize.cast(Sequelize.col('Order.id'), 'TEXT'), {
          [Op.iLike]: `%${query}%`,
        }),
      ];
    }

    filterQuery.customerId = customerId;
    filterQuery.responsibleUserId = customerClientId;

    const total = await this.ordersRepository.count({
      where: filterQuery,
    });

    const data = await this.ordersRepository.findAll({
      where: filterQuery,
      order: sortQuery,
      offset: (page - 1) * limit,
      include: [
        Customer,
        {
          model: User,
          as: 'responsibleUser',
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              include: [ProductPhoto],
            },
          ],
        },
      ],
      limit,
    });

    return {
      data,
      metadata: { page, limit, total },
    };
  }

  async exportOrderToPdf(companyId: number, orderId: number): Promise<string> {
    const company = await this.companiesService.findOne(companyId);
    const order = await this.findOne(companyId, orderId);

    const customer = await this.customersService.findOne(
      companyId,
      order.customerId,
    );

    const user = await this.usersService.findOneWithNoRole(
      order.responsibleUserId,
    );

    const htmlContent = await this.ordersMapper.generateOrderHtml(
      order,
      customer,
      user,
      company,
    );

    if (process.env.NODE_ENV === 'development') {
      return htmlContent;
    }

    const buffer = await this.ordersMapper.convertHtmlToPdf(htmlContent);
    const now = Date.now();

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const orderPdfUrl = await this.uploadsService.uploadFile(
      stream,
      `orders/${order.id}/${now}.pdf`,
    );

    let filenameToPresign = orderPdfUrl;

    if (
      filenameToPresign.startsWith('http://') ||
      filenameToPresign.startsWith('https://')
    ) {
      filenameToPresign = await this.uploadsService.getFilenameFromUrl(
        orderPdfUrl,
      );
    }

    const orderPdfUrlPreSigned = await this.uploadsService.getPresignedGetUrl(
      filenameToPresign,
      3600,
    );

    return orderPdfUrlPreSigned;
  }

  // --- REGION - Dashboard Methods --- //

  async getTotalOrdersValue(): Promise<number> {
    const orders = await this.ordersRepository.findAll({
      include: [{ model: OrderItem, include: [Product] }],
    });

    return orders.reduce((sum, order) => {
      return sum + parseFloat(order.totalValue.toString());
    }, 0);
  }

  async getTotalOrders(): Promise<number> {
    const totalOrders = await this.ordersRepository.count();

    return totalOrders;
  }

  async getAverageOrderValue(): Promise<number> {
    const totalValue = await this.getTotalOrdersValue();
    const totalOrders = await this.getTotalOrders();

    if (totalOrders === 0) return 0;

    return parseFloat((totalValue / totalOrders).toFixed(2));
  }

  async getCompanyRevenue(filter: {
    companyId: number;
    months?: string[];
    years?: string[];
    cities?: string[];
    state?: string[];
    invoices?: boolean;
    returns?: boolean;
    inApproval?: boolean;
    approved?: boolean;
    onBudget?: boolean;
    blocked?: boolean;
  }): Promise<number> {
    const {
      companyId,
      cities,
      state,
      invoices,
      returns,
      inApproval,
      approved,
      onBudget,
      blocked,
    } = filter;

    await this.companiesService.findOne(companyId);

    const whereConditions: any = {
      companyId,
      ...this.buildDateWhereClause(filter),
    };

    if (invoices === true) {
      whereConditions.status = {
        [Op.in]: [
          OrderStatus.Delivered,
          OrderStatus.Dispatched,
          OrderStatus.Invoiced,
        ],
      };
    }

    if (blocked === true) {
      whereConditions.status = OrderStatus.Blocked;
    }

    if (onBudget === true) {
      whereConditions.status = OrderStatus.OnBudget;
    }

    if (inApproval === true) {
      whereConditions.status = OrderStatus.InApproval;
    }

    if (approved === true) {
      whereConditions.status = OrderStatus.Approved;
    }

    if (returns == true) {
      whereConditions.status = OrderStatus.Returned;
    }

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const orders = await this.ordersRepository.findAll({
      where: whereConditions,
      include: [
        {
          model: OrderItem,
          include: [Product],
          required: true,
        },
        {
          model: Customer,
          where: customerWhereConditions,
          required: true,
        },
      ],
    });

    const totalValue = orders.reduce((sum, order) => {
      const value = parseFloat(order.totalValue.toString()) || 0;
      return sum + value;
    }, 0);

    return totalValue;
  }

  async getCompanyAverageTicket(data: DashboardDTO): Promise<number> {
    const { companyId, state, cities } = data;

    const whereConditions: any = {
      companyId: companyId,
      ...this.buildDateWhereClause(data),
    };

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const orders = await this.ordersRepository.findAll({
      where: whereConditions,
      include: [
        {
          model: OrderItem,
          include: [Product],
          required: true,
        },
        {
          model: Customer,
          where: customerWhereConditions,
          required: true,
        },
      ],
    });

    const totalOrders = orders.length;
    if (totalOrders === 0) return 0;

    const totalValue = orders.reduce((sum, order) => {
      const value = parseFloat(order.totalValue.toString()) || 0;
      return sum + value;
    }, 0);

    return totalValue / totalOrders;
  }

  async getRevenueByCompany(): Promise<RevenuePerEntityDto[]> {
    const results = await this.ordersRepository.findAll({
      attributes: [
        [Sequelize.col('company.fantasyName'), 'label'],
        [
          Sequelize.literal(
            'SUM("orderItems"."quantity" * "orderItems->product"."price")',
          ),
          'totalRevenue',
        ],
      ],
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          attributes: [],
          required: true,
          include: [
            { model: Product, as: 'product', attributes: [], required: true },
          ],
        },
        { model: Company, as: 'company', attributes: [], required: true },
      ],
      group: ['company.id', 'company.fantasyName'],
      order: [[Sequelize.col('company.fantasyName'), 'ASC']],
      raw: true,
    });

    return results as unknown as RevenuePerEntityDto[];
  }

  async getOrdersByCompany(): Promise<OrdersPerEntityDto[]> {
    const query = `
      SELECT 
        c."fantasyName" as label, 
        COUNT(o.id) as orders
      FROM 
        "Orders" o
      JOIN 
        "Companies" c ON o."companyId" = c.id
      GROUP BY 
        c."fantasyName"
      ORDER BY 
        c."fantasyName";
    `;

    const results = await this.ordersRepository.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results as OrdersPerEntityDto[];
  }

  async getOrdersByDay(): Promise<OrdersPerEntityDto[]> {
    const query = `
      SELECT 
        TO_CHAR(o."createdAt", 'DD/MM/YYYY') as label, 
        COUNT(o.id) as orders
      FROM 
        "Orders" o
      GROUP BY 
        TO_CHAR(o."createdAt", 'DD/MM/YYYY')
      ORDER BY 
        TO_CHAR(o."createdAt", 'DD/MM/YYYY');
    `;

    const results = await this.ordersRepository.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results as OrdersPerEntityDto[];
  }

  async getRevenueByDay(): Promise<RevenuePerEntityDto[]> {
    const query = `
      SELECT 
        TO_CHAR(o."createdAt", 'DD/MM/YYYY') as label, 
        SUM(oi.quantity * p.price) as "totalRevenue"
      FROM 
        "OrderItems" oi
      JOIN 
        "Orders" o ON oi."orderId" = o.id
      JOIN 
        "Products" p ON oi."productId" = p.id
      GROUP BY 
        TO_CHAR(o."createdAt", 'DD/MM/YYYY')
      ORDER BY 
        TO_CHAR(o."createdAt", 'DD/MM/YYYY');
    `;

    const results = await this.ordersRepository.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results.map((result: any) => {
      return {
        label: result.label,
        totalRevenue: parseFloat(result.totalRevenue.toString()),
      };
    }) as RevenuePerEntityDto[];
  }

  async getCompanyOrdersOverTime(
    data: DashboardDTO,
  ): Promise<OrdersPerEntityDto[]> {
    const { companyId, state, cities } = data;

    await this.companiesService.findOne(companyId);

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const results = await this.ordersRepository.findAll({
      attributes: [
        [
          Sequelize.fn('to_char', Sequelize.col('Order.createdAt'), 'YYYY-MM'),
          'label',
        ],
        [Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'orders'],
      ],
      where: { companyId, ...this.buildDateWhereClause(data) },
      include: [
        {
          model: Customer,
          where: customerWhereConditions,
          required: true,
        },
      ],
      group: [
        Sequelize.col('customer.id'),
        Sequelize.fn('to_char', Sequelize.col('Order.createdAt'), 'YYYY-MM'),
      ],
      order: [
        [
          Sequelize.fn('to_char', Sequelize.col('Order.createdAt'), 'YYYY-MM'),
          'ASC',
        ],
      ],
      raw: true,
    });

    return results as unknown as OrdersPerEntityDto[];
  }

  async getCompanyRevenueOverTime(
    data: DashboardDTO,
  ): Promise<RevenuePerEntityDto[]> {
    const { companyId, state, cities } = data;

    await this.companiesService.findOne(companyId);

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const results = await OrderItem.findAll({
      attributes: [
        [
          Sequelize.fn('to_char', Sequelize.col('order.createdAt'), 'YYYY-MM'),
          'label',
        ],
        [
          Sequelize.fn('SUM', Sequelize.literal('quantity * product.price')),
          'totalRevenue',
        ],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          required: true,
        },
        {
          model: Order,
          as: 'order',
          required: true,
          where: { companyId, ...this.buildDateWhereClause(data) },
          include: [
            {
              model: Customer,
              as: 'customer',
              where: customerWhereConditions,
              required: true,
            },
          ],
        },
      ],
      group: [
        Sequelize.col('order.id'),
        Sequelize.col('order.customer.id'),
        Sequelize.col('product.id'),
        Sequelize.fn('to_char', Sequelize.col('order.createdAt'), 'YYYY-MM'),
      ],
      order: [
        [
          Sequelize.fn('to_char', Sequelize.col('order.createdAt'), 'YYYY-MM'),
          'ASC',
        ],
      ],
      raw: true,
    });

    return results.map((result: any) => ({
      label: result.label,
      totalRevenue: parseFloat(result.totalRevenue.toString()),
    })) as RevenuePerEntityDto[];
  }

  async getCompanyCustomersWithOrderPerMonth(
    data: DashboardDTO,
  ): Promise<OrdersPerEntityDto[]> {
    const { companyId, state, cities } = data;

    await this.companiesService.findOne(companyId);

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const results = await this.ordersRepository.findAll({
      attributes: [
        [
          Sequelize.fn('to_char', Sequelize.col('Order.createdAt'), 'YYYY-MM'),
          'label',
        ],
        [
          Sequelize.fn(
            'COUNT',
            Sequelize.fn('DISTINCT', Sequelize.col('customerId')),
          ),
          'orders',
        ],
      ],
      where: { companyId, ...this.buildDateWhereClause(data) },
      include: [
        {
          model: Customer,
          as: 'customer',
          where: customerWhereConditions,
          required: true,
        },
      ],
      group: [
        Sequelize.col('customer.id'),
        Sequelize.fn('to_char', Sequelize.col('Order.createdAt'), 'YYYY-MM'),
      ],
      order: [
        [
          Sequelize.fn('to_char', Sequelize.col('Order.createdAt'), 'YYYY-MM'),
          'ASC',
        ],
      ],
      raw: true,
    });

    return results as unknown as OrdersPerEntityDto[];
  }

  async getCompanyOrdersByProductCategory(
    data: DashboardDTO,
  ): Promise<OrdersPerEntityDto[]> {
    const { companyId, state, cities } = data;

    await this.companiesService.findOne(companyId);

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const results = await this.ordersRepository.findAll({
      attributes: [
        [Sequelize.col('orderItems.product.subCategories.name'), 'label'],
        [Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'orders'],
      ],
      where: { companyId, ...this.buildDateWhereClause(data) },
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          required: true,
          include: [
            {
              model: Product,
              as: 'product',
              required: true,
              include: [
                {
                  model: SubCategory,
                  as: 'subCategories',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          model: Customer,
          as: 'customer',
          where: customerWhereConditions,
          required: true,
        },
      ],
      group: [
        Sequelize.col('customer.id'),
        Sequelize.col('orderItems.discount'),
        Sequelize.col('orderItems.orderId'),
        Sequelize.col('orderItems.productId'),
        Sequelize.col('orderItems.quantity'),
        Sequelize.col('orderItems.product.id'),
        Sequelize.col('orderItems.product.subCategories.id'),
        Sequelize.col('orderItems.product.subCategories.name'),
        Sequelize.col(
          'orderItems.product.subCategories.ProductSubCategory.productId',
        ),
        Sequelize.col(
          'orderItems.product.subCategories.ProductSubCategory.subCategoryId',
        ),
      ],
      order: [[Sequelize.col('orderItems.product.subCategories.name'), 'ASC']],
      raw: true,
    });

    return results as unknown as OrdersPerEntityDto[];
  }

  async getCompanyOrdersByPaymentCondition(
    data: DashboardDTO,
  ): Promise<OrdersPerEntityDto[]> {
    const { companyId, state, cities } = data;

    await this.companiesService.findOne(companyId);

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const results = await this.ordersRepository.findAll({
      attributes: [
        [Sequelize.col('paymentCondition.name'), 'label'],
        [Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'orders'],
      ],
      where: { companyId, ...this.buildDateWhereClause(data) },
      include: [
        {
          model: PaymentCondition,
          as: 'paymentCondition',
          required: true,
        },
        {
          model: Customer,
          as: 'customer',
          where: customerWhereConditions,
          required: true,
        },
      ],
      group: [
        Sequelize.col('customer.id'),
        Sequelize.col('paymentCondition.id'),
        Sequelize.col('paymentCondition.name'),
      ],
      order: [[Sequelize.col('paymentCondition.name'), 'ASC']],
      raw: true,
    });

    return results as unknown as OrdersPerEntityDto[];
  }

  async getCompanyOrdersByValueRange(
    data: DashboardDTO,
  ): Promise<OrdersPerEntityDto[]> {
    const { companyId, state, cities } = data;

    await this.companiesService.findOne(companyId);

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const orderValuesQuery = await this.ordersRepository.findAll({
      attributes: [
        'id',
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              '"orderItems"."quantity" * "orderItems->product"."price"',
            ),
          ),
          'totalValue',
        ],
      ],
      where: { companyId, ...this.buildDateWhereClause(data) },
      include: [
        {
          model: OrderItem,
          required: true,
          attributes: [],
          include: [{ model: Product, required: true, attributes: [] }],
        },
        {
          model: Customer,
          as: 'customer',
          where: customerWhereConditions,
          required: true,
        },
      ],
      group: ['Order.id', 'customer.id'],
      raw: true,
    });

    // 2. Classifica cada pedido em sua faixa de valor
    const ordersByValueRange = orderValuesQuery.reduce((acc, order: any) => {
      const totalValue = parseFloat(order.totalValue);
      let label: string;

      if (totalValue < 100) {
        label = '0-99';
      } else if (totalValue >= 100 && totalValue <= 499) {
        label = '100-499';
      } else if (totalValue >= 500 && totalValue <= 999) {
        label = '500-999';
      } else {
        label = '1000+';
      }

      const existingGroup = acc.find((item) => item.label === label);
      if (existingGroup) {
        existingGroup.orders += 1;
      } else {
        acc.push({ label, orders: 1 });
      }

      return acc;
    }, []);

    // 3. Ordena o resultado final
    ordersByValueRange.sort((a, b) => a.label.localeCompare(b.label));

    return ordersByValueRange;
  }

  async getCompanyProductsByRevenue(
    data: DashboardDTO,
  ): Promise<RevenuePerEntityDto[]> {
    const { companyId, state, cities } = data;

    await this.companiesService.findOne(companyId);

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const totalRevenueLiteral = Sequelize.literal(
      'SUM("orderItems"."quantity" * "orderItems->product"."price")',
    );

    const results = await this.ordersRepository.findAll({
      attributes: [
        [Sequelize.col('orderItems.product.name'), 'label'],
        [totalRevenueLiteral, 'totalRevenue'],
      ],
      where: { companyId, ...this.buildDateWhereClause(data) },
      include: [
        {
          model: OrderItem,
          required: true,
          attributes: [],
          include: [
            {
              model: Product,
              required: true,
              attributes: [],
            },
          ],
        },
        {
          model: Customer,
          as: 'customer',
          where: customerWhereConditions,
          required: true,
        },
      ],
      group: [
        Sequelize.col('customer.id'),
        Sequelize.col('orderItems.product.name'),
      ],
      order: [[Sequelize.literal('"totalRevenue"'), 'DESC']],
      raw: true,
    });

    return results.map((result: any) => ({
      label: result.label,
      totalRevenue: parseFloat(result.totalRevenue.toString()),
    })) as RevenuePerEntityDto[];
  }

  async getCompanyAverageOrdersPerCustomer(
    data: DashboardDTO,
  ): Promise<OrdersPerEntityDto[]> {
    const { companyId, state, cities } = data;
    await this.companiesService.findOne(companyId);

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const results = await this.ordersRepository.findAll({
      attributes: [
        [Sequelize.col('customer.corporateName'), 'label'],
        [Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'orders'],
      ],
      where: { companyId, ...this.buildDateWhereClause(data) },
      include: [
        {
          model: Customer,
          as: 'customer',
          where: customerWhereConditions,
          required: true,
        },
      ],
      group: [
        Sequelize.col('customer.corporateName'),
        Sequelize.col('customer.id'),
      ],
      order: [[Sequelize.col('customer.corporateName'), 'ASC']],
      raw: true,
    });

    return results as unknown as OrdersPerEntityDto[];
  }

  async countCustomersLast90DaysByState(data: DashboardDTO): Promise<number> {
    const { companyId, state, months, cities } = data;

    const whereCondition: any = {
      companyId,
      ...this.buildDateWhereClause(data),
    };

    if (!(months && months.length > 0)) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      whereCondition.createdAt = {
        [Op.gte]: ninetyDaysAgo,
      };
    }

    const customerInclude: any = {
      model: Customer,
      required: true,
    };

    if (state) {
      customerInclude.where = {
        UF: { [Op.in]: state },
      };
      if (cities) {
        customerInclude.where.city = { [Op.in]: cities };
      }
    }

    const uniqueCustomers = await this.ordersRepository.findAll({
      attributes: ['customerId'],
      where: whereCondition,
      include: [customerInclude],
      group: ['customer.id', 'customerId'],
      subQuery: false,
    });

    return uniqueCustomers.length;
  }

  async getAverageItemsPerOrder(data: DashboardDTO): Promise<number> {
    const { companyId, state, cities } = data;

    const orderWhere: WhereOptions = {
      companyId,
      ...this.buildDateWhereClause(data),
    };

    const customerIncludeWhere: WhereOptions = {};
    if (state) {
      customerIncludeWhere.UF = { [Op.in]: state };
    }
    if (cities) {
      customerIncludeWhere.city = { [Op.in]: cities };
    }

    const ordersWithItemCounts = await this.ordersRepository.findAll({
      attributes: [
        'id',
        [fn('COUNT', col('orderItems.productId')), 'itemCount'],
      ],
      include: [
        {
          model: Customer,
          required: true,
          as: 'customer',
          where: customerIncludeWhere,
        },
        {
          model: OrderItem,
          as: 'orderItems',
          attributes: [],
        },
      ],
      where: orderWhere,
      group: ['Order.id', 'customer.id'],
    });

    if (ordersWithItemCounts.length === 0) {
      return 0;
    }

    const totalItemsCount = ordersWithItemCounts.reduce(
      (sum, order: any) => sum + parseInt(order.get('itemCount'), 10),
      0,
    );
    const totalOrders = ordersWithItemCounts.length;

    return (totalItemsCount / totalOrders).toFixed(2) as unknown as number;
  }

  async getTotalOrdersForNewCustomers(data: DashboardDTO): Promise<number> {
    const { companyId, state, cities } = data;

    const dateRangeCondition: WhereOptions =
      this.buildDateWhereClauseForCustomer(data);
    const orderDateRangeCondition: WhereOptions =
      this.buildDateWhereClause(data);

    const whereConditions: WhereOptions = {
      companyId,
      status: {
        [Op.in]: [
          OrderStatus.Approved,
          OrderStatus.Delivered,
          OrderStatus.Dispatched,
          OrderStatus.Invoiced,
        ],
      },
      ...orderDateRangeCondition,
    };

    const orders = await this.ordersRepository.findAll({
      include: [
        {
          model: Customer,
          required: true,
          where: {
            ...(state && { UF: { [Op.in]: state } }),
            ...(cities && { city: { [Op.in]: cities } }),
            companyId,
            ...dateRangeCondition,
          },
          attributes: [],
        },
      ],
      where: whereConditions,
      attributes: ['totalValue'],
    });

    const totalOrders = orders.length;
    if (totalOrders === 0) {
      return 0;
    }

    const totalValue = orders.reduce((sum, order) => {
      const value = Number(order.get('totalValue')) || 0;
      return sum + value;
    }, 0);

    return totalValue;
  }

  async getCompanyCanceledValue(data: DashboardDTO): Promise<number> {
    const { companyId, state, cities } = data;

    await this.companiesService.findOne(companyId);

    const whereConditions: any = {
      companyId,
      ...this.buildDateWhereClause(data),
    };

    whereConditions.status = OrderStatus.Canceled;

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const orders = await this.ordersRepository.findAll({
      where: whereConditions,
      include: [
        {
          model: OrderItem,
          include: [Product],
          required: true,
        },
        {
          model: Customer,
          where: customerWhereConditions,
          required: true,
        },
      ],
    });

    const totalValue = orders.reduce((sum, order) => {
      const value = parseFloat(order.totalValue.toString()) || 0;
      return sum + value;
    }, 0);

    return totalValue;
  }

  async getCompanyAverageTimeBetweenOrders(
    data: DashboardDTO,
  ): Promise<number> {
    const { companyId, state, cities } = data;

    await this.companiesService.findOne(companyId);

    const whereConditions: any = {
      companyId,
      ...this.buildDateWhereClause(data),
    };

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const allOrders = await this.ordersRepository.findAll({
      attributes: ['customerId', 'createdAt'],
      order: [
        ['customerId', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      where: whereConditions,
      include: [
        {
          model: Customer,
          where: customerWhereConditions,
          required: true,
        },
      ],
    });

    if (allOrders.length <= 1) {
      return 0;
    }

    let totalTimeDifferenceMs = 0;
    let numberOfIntervals = 0;
    let lastOrderTimestamp: number | null = null;
    let lastCustomerId: number | null = null;

    for (const order of allOrders) {
      const currentCustomerId = order.customerId;
      const currentOrderTimestamp = order.createdAt.getTime();

      if (lastCustomerId !== null && lastCustomerId === currentCustomerId) {
        const timeDifferenceMs = currentOrderTimestamp - lastOrderTimestamp;
        totalTimeDifferenceMs += timeDifferenceMs;
        numberOfIntervals++;
      }

      lastCustomerId = currentCustomerId;
      lastOrderTimestamp = currentOrderTimestamp;
    }

    if (numberOfIntervals === 0) {
      return 0;
    }

    const averageTimeMs = totalTimeDifferenceMs / numberOfIntervals;
    const millisecondsInDay = 1000 * 60 * 60 * 24;
    const averageTimeDays = averageTimeMs / millisecondsInDay;

    return Math.ceil(averageTimeDays);
  }

  async getCompanyInvoiceConversion(data: DashboardDTO): Promise<number> {
    const { companyId, state, cities } = data;

    await this.companiesService.findOne(companyId);

    const whereConditions: any = {
      companyId,
      ...this.buildDateWhereClause(data),
    };

    const customerWhereConditions: any = {};
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const allOrders = await this.ordersRepository.count({
      where: whereConditions,
      include: [
        {
          model: Customer,
          where: customerWhereConditions,
          required: true,
        },
      ],
    });

    whereConditions.status = {
      [Op.in]: [
        OrderStatus.Approved,
        OrderStatus.Delivered,
        OrderStatus.Dispatched,
        OrderStatus.Invoiced,
        OrderStatus.Returned,
      ],
    };

    const invoicedOrders = await this.ordersRepository.count({
      where: whereConditions,
      include: [
        {
          model: Customer,
          where: customerWhereConditions,
          required: true,
        },
      ],
    });

    const percentualInvoiced = (invoicedOrders * 100) / allOrders || 0;
    return percentualInvoiced.toFixed(2) as unknown as number;
  }

  async getCompanyReactivatedCustomersCount(
    data: DashboardDTO,
  ): Promise<number> {
    const { companyId, state, cities } = data;
    const { months, years } = data;

    let recentStartDate: Date,
      recentEndDate: Date,
      inactiveStartDate: Date,
      inactiveEndDate: Date;

    if (months?.length > 0 || years?.length > 0) {
      const orConditions =
        (this.buildDateWhereClause(data)[Op.or] as {
          createdAt: { [Op.between]: Date[] };
        }[]) || [];
      const allDates = orConditions.flatMap((c) => c.createdAt[Op.between]);

      recentStartDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
      recentEndDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

      inactiveEndDate = new Date(recentStartDate);
      inactiveStartDate = new Date(inactiveEndDate);
      inactiveStartDate.setDate(inactiveEndDate.getDate() - 90);
    } else {
      recentEndDate = new Date();
      recentStartDate = new Date(recentEndDate);
      recentStartDate.setDate(recentEndDate.getDate() - 90);

      inactiveEndDate = new Date(recentStartDate);
      inactiveStartDate = new Date(inactiveEndDate);
      inactiveStartDate.setDate(inactiveEndDate.getDate() - 90);
    }

    const customerWhereConditions: any = {
      companyId,
    };
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const inactiveCustomers = await this.ordersRepository.findAll({
      where: {
        createdAt: {
          [Op.between]: [inactiveStartDate, inactiveEndDate],
        },
      },
      include: [
        {
          model: Customer,
          required: true,
          attributes: [],
          where: customerWhereConditions,
        },
      ],
      attributes: ['customerId'],
      group: ['customerId'],
    });

    const inactiveCustomerIdsList = inactiveCustomers.map(
      (order) => order.customerId,
    );

    const reactivatedWhere: WhereOptions = {
      [Op.and]: [
        this.buildDateWhereClause(data),
        { customerId: { [Op.notIn]: inactiveCustomerIdsList } },
      ],
    };

    const reactivatedCustomers = await this.ordersRepository.findAll({
      where: reactivatedWhere,
      include: [
        {
          model: Customer,
          required: true,
          attributes: [],
          where: {
            ...customerWhereConditions,
            createdAt: {
              [Op.lt]: inactiveStartDate,
            },
          },
        },
      ],
      attributes: ['customerId'],
      group: ['customerId'],
    });

    const totalReactivated = await reactivatedCustomers;
    return totalReactivated.length;
  }

  async getCompanyReactivatedCustomersTotalValue(
    data: DashboardDTO,
  ): Promise<number> {
    const { companyId, state, cities, months, years } = data;

    let recentStartDate: Date,
      recentEndDate: Date,
      inactiveStartDate: Date,
      inactiveEndDate: Date;

    if (months?.length > 0 || years?.length > 0) {
      const orConditions =
        (this.buildDateWhereClause(data)[Op.or] as {
          createdAt: { [Op.between]: Date[] };
        }[]) || [];
      const allDates = orConditions.flatMap((c) => c.createdAt[Op.between]);

      recentStartDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
      recentEndDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

      inactiveEndDate = new Date(recentStartDate);
      inactiveStartDate = new Date(inactiveEndDate);
      inactiveStartDate.setDate(inactiveEndDate.getDate() - 90);
    } else {
      recentEndDate = new Date();
      recentStartDate = new Date(recentEndDate);
      recentStartDate.setDate(recentEndDate.getDate() - 90);

      inactiveEndDate = new Date(recentStartDate);
      inactiveStartDate = new Date(inactiveEndDate);
      inactiveStartDate.setDate(inactiveEndDate.getDate() - 90);
    }

    const customerWhereConditions: any = {
      companyId,
    };
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const customersWithOrdersInInactivePeriod =
      await this.ordersRepository.findAll({
        where: {
          createdAt: { [Op.between]: [inactiveStartDate, inactiveEndDate] },
        },
        include: [
          {
            model: Customer,
            required: true,
            attributes: [],
            where: customerWhereConditions,
          },
        ],
        attributes: ['customerId'],
        group: ['customerId'],
      });

    const customersWithOrdersInInactivePeriodIds =
      customersWithOrdersInInactivePeriod.map((order) => order.customerId);

    const reactivatedWhere: WhereOptions = {
      [Op.and]: [
        { createdAt: { [Op.between]: [recentStartDate, recentEndDate] } },
        { customerId: { [Op.notIn]: customersWithOrdersInInactivePeriodIds } },
      ],
    };

    const reactivatedCustomers = await this.ordersRepository.findAll({
      where: reactivatedWhere,
      include: [
        {
          model: Customer,
          required: true,
          attributes: [],
          where: {
            ...customerWhereConditions,
            createdAt: {
              [Op.lt]: inactiveStartDate,
            },
          },
        },
      ],
      attributes: ['totalValue'],
    });

    const totalValue = reactivatedCustomers.reduce((sum, order) => {
      const value = Number(order.get('totalValue')) || 0;
      return sum + value;
    }, 0);

    return totalValue;
  }

  async getCompanyInactiveToReactivatedRatio(
    data: DashboardDTO,
  ): Promise<number> {
    const { companyId, state, cities, months, years } = data;

    let recentStartDate: Date,
      recentEndDate: Date,
      inactiveStartDate: Date,
      inactiveEndDate: Date;

    if (months?.length > 0 || years?.length > 0) {
      const orConditions =
        (this.buildDateWhereClause(data)[Op.or] as {
          createdAt: { [Op.between]: Date[] };
        }[]) || [];
      const allDates = orConditions.flatMap((c) => c.createdAt[Op.between]);

      recentStartDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
      recentEndDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

      inactiveEndDate = new Date(recentStartDate);
      inactiveStartDate = new Date(inactiveEndDate);
      inactiveStartDate.setDate(inactiveEndDate.getDate() - 90);
    } else {
      recentEndDate = new Date();
      recentStartDate = new Date(recentEndDate);
      recentStartDate.setDate(recentEndDate.getDate() - 90);

      inactiveEndDate = new Date(recentStartDate);
      inactiveStartDate = new Date(inactiveEndDate);
      inactiveStartDate.setDate(inactiveEndDate.getDate() - 90);
    }

    const customerWhereConditions: any = {
      companyId,
    };
    if (state) {
      customerWhereConditions.UF = { [Op.in]: state };
    }
    if (cities) {
      customerWhereConditions.city = { [Op.in]: cities };
    }

    const customersWithOrdersInInactivePeriod =
      await this.ordersRepository.findAll({
        where: {
          createdAt: { [Op.between]: [inactiveStartDate, inactiveEndDate] },
        },
        include: [
          {
            model: Customer,
            required: true,
            attributes: [],
            where: customerWhereConditions,
          },
        ],
        attributes: ['customerId'],
        group: ['customerId'],
      });

    const customersWithOrdersInInactivePeriodIds =
      customersWithOrdersInInactivePeriod.map((order) => order.customerId);

    const totalCustomersBeforeInactivePeriod = await this.customersService
      .getModel()
      .count({
        where: {
          ...customerWhereConditions,
          createdAt: { [Op.lt]: inactiveStartDate },
        },
      });

    const totalInactiveCustomers =
      totalCustomersBeforeInactivePeriod -
      customersWithOrdersInInactivePeriodIds.length;

    const reactivatedCustomersCount =
      await this.getCompanyReactivatedCustomersCount(data);

    if (totalInactiveCustomers === 0) {
      return 0;
    }

    const ratio = (reactivatedCustomersCount / totalInactiveCustomers) * 100;

    return parseFloat(ratio.toFixed(2));
  }

  async generateCompanyOrderReport(data: DashboardDTO): Promise<Order[]> {
    const { companyId, state, cities } = data;

    const whereConditions: any = {
      companyId,
      ...this.buildDateWhereClause(data),
    };

    // Narrowed to exactly what the customizable-report sheet reads (see flattenOrderData in
    // the front, app/(admin)/company/[companyId]/reports/custom/page.tsx) — this was the only
    // one of the four report endpoints not doing SQL aggregation, and it hydrated full model
    // instances (Product alone has ~35 columns, one a 3000-char description) for every
    // order × item × photo row, including ProductPhoto, which the sheet never reads at all.
    // Row *count* is unchanged (still every matching order for the period, no limit added —
    // this report's whole point is the full dataset to pivot on) — only each row's width.
    const orders = await this.ordersRepository.findAll({
      where: whereConditions,
      attributes: [
        'id',
        'status',
        'totalValue',
        'createdAt',
        'amountPaid',
        'discount',
      ],
      include: [
        {
          model: Customer,
          attributes: [
            'id',
            'fantasyName',
            'corporateName',
            'document',
            'segment',
            'UF',
            'customerGroupCode',
          ],
          required: true,
          where: {
            ...(cities && { city: { [Op.in]: cities } }),
          },
        },
        {
          model: OrderItem,
          attributes: ['id', 'quantity', 'discount', 'productId'],
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'price', 'brand', 'unitOfMeasure'],
            },
          ],
          required: true,
        },
        {
          model: PaymentCondition,
          attributes: ['id', 'name'],
          required: true,
        },
      ],
    });

    return orders;
  }

  /**
   * Histórico de compra de um cliente, agregado por produto.
   *
   * Alimenta o seletor de produtos do pedido: o vendedor precisa saber, ao montar
   * uma reposição, o que aquele cliente já compra, há quanto tempo e em que volume.
   *
   * Conta apenas pedidos comercialmente confirmados. Orçamento e pedido em aprovação
   * ainda podem não virar venda; cancelado e devolvido são reversões — contá-los faria
   * o vendedor reofertar algo que o cliente recusou. Bloqueado também não é compra firme.
   */
  async getCustomerProductHistory(
    companyId: number,
    customerId: number,
    query: CustomerProductHistoryQueryDto = {},
  ): Promise<CustomerProductHistoryDto> {
    await this.companiesService.findOne(companyId);
    await this.customersService.findOne(companyId, customerId);

    const windowDays = query.windowDays ?? DEFAULT_PURCHASE_WINDOW_DAYS;
    const excludeOrderId = query.excludeOrderId ?? null;

    const countedStatuses = [
      OrderStatus.Approved,
      OrderStatus.Invoiced,
      OrderStatus.Dispatched,
      OrderStatus.Delivered,
    ];

    const sql = `
      WITH qualifying AS (
        SELECT
          oi."productId"   AS product_id,
          oi.quantity      AS quantity,
          o.id             AS order_id,
          o."createdAt"    AS created_at
        FROM "OrderItems" oi
        JOIN "Orders" o ON o.id = oi."orderId"
        WHERE o."companyId" = :companyId
          AND o."customerId" = :customerId
          AND o.status IN (:statuses)
          AND (:excludeOrderId::int IS NULL OR o.id <> :excludeOrderId::int)
      ),
      last_purchase AS (
        SELECT DISTINCT ON (product_id)
          product_id,
          created_at AS last_at,
          quantity   AS last_quantity
        FROM qualifying
        ORDER BY product_id, created_at DESC, order_id DESC
      )
      SELECT
        q.product_id                                   AS "productId",
        TO_CHAR(lp.last_at, 'YYYY-MM-DD')              AS "lastPurchaseAt",
        lp.last_quantity                               AS "lastPurchaseQuantity",
        COALESCE(SUM(q.quantity) FILTER (
          WHERE q.created_at >= NOW() - (:windowDays::int * INTERVAL '1 day')
        ), 0)                                          AS "quantityInWindow",
        COALESCE(SUM(q.quantity), 0)                   AS "totalQuantity",
        COUNT(DISTINCT q.order_id)                     AS "orderCount"
      FROM qualifying q
      JOIN last_purchase lp ON lp.product_id = q.product_id
      GROUP BY q.product_id, lp.last_at, lp.last_quantity
      ORDER BY lp.last_at DESC;
    `;

    const rows = await this.ordersRepository.sequelize.query(sql, {
      type: QueryTypes.SELECT,
      replacements: {
        companyId,
        customerId,
        windowDays,
        excludeOrderId,
        statuses: countedStatuses,
      },
    });

    const items: CustomerProductHistoryItemDto[] = (rows as any[]).map(
      (row) => ({
        productId: Number(row.productId),
        lastPurchaseAt: row.lastPurchaseAt,
        lastPurchaseQuantity: Number(row.lastPurchaseQuantity),
        quantityInWindow: Number(row.quantityInWindow),
        totalQuantity: Number(row.totalQuantity),
        orderCount: Number(row.orderCount),
      }),
    );

    return { windowDays, items };
  }
}
