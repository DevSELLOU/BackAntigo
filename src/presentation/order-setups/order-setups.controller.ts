import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { ExportDataDto, ExportFormat } from 'src/exports/dtos/export-data.dto';
import { ExportsService } from 'src/exports/exports.service';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { addCompanyIdToFilters } from 'src/utils/filter-utils';
import { CreateOrderSetupDto } from './dtos/create-order-setup.dto';
import { UpdateOrderSetupDto } from './dtos/update-order-setup.dto';
import { OrderSetupsService } from './order-setups.service';

@ApiTags('order-setups')
@Controller('company/:id/order-setup')
@ApiBearerAuth()
export class OrderSetupsController {
  constructor(
    private readonly orderSetupsService: OrderSetupsService,
    @Inject(ExportsService) private readonly exportsService: ExportsService,
  ) {}

  @Post()
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createOrderSetup(
    @Param('id') companyId: number,
    @Body() createOrderSetupDto: CreateOrderSetupDto,
  ) {
    const createdOrderSetup = await this.orderSetupsService.createOrderSetup(
      createOrderSetupDto,
      companyId,
    );

    return {
      message: 'Configuração de pedido criada com sucesso',
      data: createdOrderSetup,
    };
  }

  @Get('export')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  async exportOrderSetups(
    @Param('id') companyId: number,
    @Query() exportDto: ExportDataDto,
  ) {
    const format = exportDto.format || ExportFormat.CSV;

    let selectFields = undefined;
    if (exportDto.selectedFields) {
      selectFields = exportDto.selectedFields
        .split(',')
        .map((field) => field.trim());
    }

    const filteredExportDto = addCompanyIdToFilters(exportDto, companyId);

    const orderSetupModel = this.orderSetupsService.getModel();

    const result = await this.exportsService.exportData(
      orderSetupModel,
      filteredExportDto,
      'orderSetups',
      'Configurações de Pedido',
      format,
      ['minDays', 'maxDays'],
      selectFields,
    );

    return {
      message: 'Arquivo de configurações de pedido gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Get('export/selectable-fields')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('orderSetups');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Get(':orderSetupId')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  async findOne(
    @Param('id') companyId: number,
    @Param('orderSetupId') orderSetupId: number,
  ) {
    const orderSetup = await this.orderSetupsService.findOne(
      companyId,
      orderSetupId,
    );

    return {
      message: 'Configuração de pedido retornada com sucesso',
      data: orderSetup,
    };
  }

  @Get()
  @Roles(
    ...getRolesAccessibleByRole(UserRole.RegionalManager),
    UserRole.CustomerClient,
  )
  async findAll(
    @Param('id') companyId: number,
    @Query() query: BaseFindAllDataDto,
  ) {
    const { data, metadata } = await this.orderSetupsService.findAll(
      companyId,
      query,
    );

    return {
      message: 'Configurações de pedido retornadas com sucesso',
      data,
      metadata,
    };
  }

  @Patch(':orderSetupId')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateOrderSetup(
    @Param('id') companyId: number,
    @Param('orderSetupId') orderSetupId: number,
    @Body() updateOrderSetupDto: UpdateOrderSetupDto,
  ) {
    const updatedOrderSetup = await this.orderSetupsService.updateOrderSetup(
      companyId,
      orderSetupId,
      updateOrderSetupDto,
    );

    return {
      message: 'Configuração de pedido atualizada com sucesso',
      data: updatedOrderSetup,
    };
  }

  @Delete(':orderSetupId')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  async deleteOrderSetup(
    @Param('id') companyId: number,
    @Param('orderSetupId') orderSetupId: number,
  ) {
    await this.orderSetupsService.deleteOrderSetup(companyId, orderSetupId);

    return {
      message: 'Configuração de pedido removida com sucesso',
    };
  }
}
