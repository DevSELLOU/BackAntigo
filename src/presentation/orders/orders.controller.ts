import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthAdministrator } from 'src/auth/decorators/authenticated-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthenticatedUserDto } from 'src/auth/dtos/authenticated-user.dto';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { ExportDataDto, ExportFormat } from 'src/exports/dtos/export-data.dto';
import { ExportsService } from 'src/exports/exports.service';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { addCompanyIdToFilters } from 'src/utils/filter-utils';
import { logger } from 'src/utils/logger';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderAmountPaidDto } from './dtos/update-order-amount-paid.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import { SplitOrderDto } from './dtos/split-order.dto';
import { CustomerProductHistoryQueryDto } from './dtos/customer-product-history.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('company/:companyId/orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(ExportsService)
    private readonly exportsService: ExportsService,
  ) {}

  @Roles(...getRolesAccessibleByRole(UserRole.CustomerClient))
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createOrder(
    @AuthAdministrator() authenticatedUserDto: AuthenticatedUserDto,
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    logger.info(
      `[ORDERS] Create order request | companyId: ${companyId} | userId: ${authenticatedUserDto.id} | customerId: ${createOrderDto.customerId}`,
    );

    const createdOrder = await this.ordersService.createOrder(
      companyId,
      createOrderDto,
      authenticatedUserDto,
    );

    logger.info(
      `[ORDERS] Order created successfully | orderId: ${createdOrder.id} | companyId: ${companyId} | userId: ${authenticatedUserDto.id}`,
    );

    return {
      message: 'Pedido criado com sucesso',
      data: createdOrder,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Get('export')
  async exportOrders(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query() exportDto: ExportDataDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = user?.id ?? 0;
    const format = exportDto.format || ExportFormat.CSV;

    let selectFields = undefined;
    if (exportDto.selectedFields) {
      selectFields = exportDto.selectedFields
        .split(',')
        .map((field) => field.trim());

      logger.info(
        `[ORDERS] Export request | companyId: ${companyId} | userId: ${userId} | format: ${format}`,
      );
    }

    const filteredExportDto = addCompanyIdToFilters(exportDto, companyId);

    const orderModel = this.ordersService.getModel();

    const result = await this.exportsService.exportData(
      orderModel,
      filteredExportDto,
      'orders',
      'Pedidos',
      format,
      ['status', 'observation'],
      selectFields,
    );

    return {
      message: 'Arquivo de pedidos gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Get('export/selectable-fields')
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('orders');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Get('customer-history/:customerId')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async getCustomerProductHistory(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query() query: CustomerProductHistoryQueryDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    logger.info(
      `[ORDERS] Customer product history request | companyId: ${companyId} | customerId: ${customerId} | userId: ${
        user?.id ?? 0
      }`,
    );

    const history = await this.ordersService.getCustomerProductHistory(
      companyId,
      customerId,
      query,
    );

    return {
      message: 'Histórico de compras do cliente retornado com sucesso',
      data: history,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Get(':id')
  async findOne(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = user?.id ?? 0;
    logger.info(
      `[ORDERS] Find one request | orderId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    const order = await this.ordersService.findOne(companyId, id);

    return {
      message: 'Pedido retornado com sucesso',
      data: order,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Get()
  async findAll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query() query: BaseFindAllDataDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = user?.id ?? 0;
    logger.info(
      `[ORDERS] Find all request | companyId: ${companyId} | userId: ${userId} | page: ${
        query.page || 1
      } | limit: ${query.limit || 10}`,
    );

    const { data, metadata } = await this.ordersService.findAll(
      companyId,
      query,
    );

    return {
      message: 'Pedidos retornados com sucesso',
      data,
      metadata,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateOrder(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = user?.id ?? 0;
    logger.info(
      `[ORDERS] Update order request | orderId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    const updatedOrder = await this.ordersService.updateOrder(
      companyId,
      id,
      updateOrderDto,
    );

    logger.info(
      `[ORDERS] Order updated successfully | orderId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    return {
      message: 'Pedido atualizado com sucesso',
      data: updatedOrder,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Delete(':id')
  async deleteOrder(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = user?.id ?? 0;
    logger.info(
      `[ORDERS] Delete order request | orderId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    await this.ordersService.deleteOrder(companyId, id);

    logger.info(
      `[ORDERS] Order deleted successfully | orderId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    return {
      message: 'Pedido removido com sucesso',
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Patch(':id/status')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async updateStatus(
    @AuthAdministrator() authenticatedUserDto: AuthenticatedUserDto,
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    logger.info(
      `[ORDERS] Update status request | orderId: ${id} | companyId: ${companyId} | newStatus: ${updateStatusDto.status} | userId: ${authenticatedUserDto.id}`,
    );

    const result = await this.ordersService.updateStatus(
      companyId,
      id,
      updateStatusDto,
      authenticatedUserDto.id,
    );

    logger.info(
      `[ORDERS] Status updated successfully | orderId: ${id} | companyId: ${companyId} | newStatus: ${updateStatusDto.status} | userId: ${authenticatedUserDto.id}`,
    );

    return {
      message: result.newOrder
        ? 'Pedido faturado parcialmente. Novo pedido criado com os produtos restantes.'
        : 'Status do pedido atualizado com sucesso',
      data: result,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Post(':id/split')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async splitOrder(
    @AuthAdministrator() authenticatedUserDto: AuthenticatedUserDto,
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() splitOrderDto: SplitOrderDto,
  ) {
    logger.info(
      `[ORDERS] Split order request | orderId: ${id} | companyId: ${companyId} | userId: ${authenticatedUserDto.id}`,
    );

    const result = await this.ordersService.splitOrder(
      companyId,
      id,
      splitOrderDto.items,
      authenticatedUserDto.id,
    );

    logger.info(
      `[ORDERS] Order split successfully | originalOrderId: ${id} | newOrderId: ${result.newOrder?.id} | companyId: ${companyId} | userId: ${authenticatedUserDto.id}`,
    );

    return {
      message:
        'Pedido dividido com sucesso. Novo pedido criado com os produtos restantes.',
      data: result,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Patch(':id/amount-paid')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateAmountPaid(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAmountPaidDto: UpdateOrderAmountPaidDto,
  ) {
    logger.info(
      `[ORDERS] Update amount paid request | orderId: ${id} | companyId: ${companyId} | amount: ${updateAmountPaidDto.amountPaid}`,
    );

    const updatedOrder = await this.ordersService.updateAmountPaid(
      companyId,
      id,
      updateAmountPaidDto,
    );

    logger.info(
      `[ORDERS] Amount paid updated successfully | orderId: ${id} | companyId: ${companyId}`,
    );

    return {
      message: 'Valor pago do pedido atualizado com sucesso',
      data: updatedOrder,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Get(':id/export')
  async exportOrder(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const orderPdf = await this.ordersService.exportOrderToPdf(companyId, id);

    return {
      message: 'Pedido exportado com sucesso',
      data: orderPdf,
    };
  }
}
