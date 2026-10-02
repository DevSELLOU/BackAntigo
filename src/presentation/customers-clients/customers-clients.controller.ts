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
import { Roles } from 'src/auth/decorators/roles.decorator';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { ExportDataDto, ExportFormat } from 'src/exports/dtos/export-data.dto';
import { ExportsService } from 'src/exports/exports.service';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { addCompanyAndCustomerIdToFilters } from 'src/utils/filter-utils';
import { CustomersClientsService } from './customers-clients.service';
import { CreateCustomerClientDto } from './dtos/create-customer-client.dto';
import { UpdateCustomerClientDto } from './dtos/update-customer-client.dto';

@ApiTags('customers-clients')
@Controller('company/:companyId/customers/:customerId/customers-clients')
@ApiBearerAuth()
export class CustomersClientsController {
  constructor(
    private readonly customerClientsService: CustomersClientsService,
    @Inject(ExportsService)
    private readonly exportsService: ExportsService,
  ) {}

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createCustomerClient(
    @Param('companyId') companyId: number,
    @Param('customerId') customerId: number,
    @Body() createCustomerClientDto: CreateCustomerClientDto,
  ) {
    const createdCustomerClient =
      await this.customerClientsService.createCustomerClient(
        companyId,
        customerId,
        createCustomerClientDto,
      );

    return {
      message: 'Cliente final criado com sucesso',
      data: createdCustomerClient,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Get('export')
  async exportCustomerClients(
    @Param('companyId') companyId: number,
    @Param('customerId') customerId: number,
    @Query() exportDto: ExportDataDto,
  ) {
    const format = exportDto.format || ExportFormat.CSV;

    let selectFields = undefined;
    if (exportDto.selectedFields) {
      selectFields = exportDto.selectedFields
        .split(',')
        .map((field) => field.trim());
    }

    const filteredExportDto = addCompanyAndCustomerIdToFilters(
      exportDto,
      companyId,
      customerId,
    );

    const userModel = this.customerClientsService.getModel();

    const result = await this.exportsService.exportData(
      userModel,
      filteredExportDto,
      'customerClients',
      'Clientes Finais',
      format,
      ['name', 'email', 'phoneNumber'],
      selectFields,
    );

    return {
      message: 'Arquivo de clientes finais gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Get('export/selectable-fields')
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('customerClients');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Get(':id')
  async findOne(
    @Param('companyId') companyId: number,
    @Param('customerId') customerId: number,
    @Param('id') id: number,
  ) {
    const foundCustomerClient = await this.customerClientsService.findOne(
      companyId,
      customerId,
      id,
    );

    return {
      message: 'Cliente final retornado com sucesso',
      data: foundCustomerClient,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Get()
  async findAll(
    @Param('companyId') companyId: number,
    @Param('customerId') customerId: number,
    @Query() query: BaseFindAllDataDto,
  ) {
    const { data, metadata } = await this.customerClientsService.findAll(
      companyId,
      customerId,
      query,
    );

    return {
      message: 'Clientes finais retornados com sucesso',
      data,
      metadata,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateCustomerClient(
    @Param('companyId') companyId: number,
    @Param('customerId') customerId: number,
    @Param('id') id: number,
    @Body() updateCustomerClientDto: UpdateCustomerClientDto,
  ) {
    const updatedCustomerClient =
      await this.customerClientsService.updateCustomerClient(
        companyId,
        customerId,
        id,
        updateCustomerClientDto,
      );

    return {
      message: 'Cliente final atualizado com sucesso',
      data: updatedCustomerClient,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Delete(':id')
  async deleteCustomerClient(
    @Param('companyId') companyId: number,
    @Param('customerId') customerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.customerClientsService.deleteCustomerClient(
      companyId,
      customerId,
      id,
    );

    return {
      message: 'Cliente final removido com sucesso',
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.CustomerClient))
  @Get(':id/orders')
  async findAllOrders(
    @Param('companyId') companyId: number,
    @Param('customerId') customerId: number,
    @Param('id') id: number,
    @Query() query: BaseFindAllDataDto,
  ) {
    const { data, metadata } = await this.customerClientsService.findAllOrders(
      companyId,
      customerId,
      id,
      query,
    );

    return {
      message: 'Pedidos retornados com sucesso',
      data,
      metadata,
    };
  }
}
