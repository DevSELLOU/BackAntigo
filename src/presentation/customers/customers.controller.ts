import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Inject,
  Param,
  ParseEnumPipe,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthAdministrator } from 'src/auth/decorators/authenticated-user.decorator';
import { AuthenticatedUserDto } from 'src/auth/dtos/authenticated-user.dto';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { ExportDataDto, ExportFormat } from 'src/exports/dtos/export-data.dto';
import { ExportsService } from 'src/exports/exports.service';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { addCompanyIdToFilters } from 'src/utils/filter-utils';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';

@ApiTags('customers')
@Controller('company/:id/customer')
@Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
@ApiBearerAuth()
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    @Inject(ExportsService)
    private readonly exportsService: ExportsService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createCustomer(
    @Param('id') companyId: number,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    const createdCustomer = await this.customersService.createCustomer(
      companyId,
      createCustomerDto,
    );

    return {
      message: 'Cliente criado com sucesso',
      data: createdCustomer,
    };
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCustomers(
    @Param('id') companyId: number,
    @Body('mode', new ParseEnumPipe(['create', 'update']))
    mode: 'create' | 'update',
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'text/csv' })],
        fileIsRequired: true,
      }),
    )
    file: Multer.File,
  ) {
    const result = await this.customersService.importCustomersFromCSV(
      companyId,
      file.buffer,
      mode,
    );

    return {
      message: `${result.count} clientes foram processados com sucesso.`,
      data: result,
    };
  }

  @Get('export')
  async exportCustomers(
    @Param('id') companyId: number,
    @Query() exportDto: ExportDataDto,
  ) {
    const format = exportDto.format || ExportFormat.CSV;

    let selectFields = undefined;
    if (exportDto.selectedFields) {
      selectFields = exportDto.selectedFields
        .split(';')
        .map((field) => field.trim());
    }

    const filteredExportDto = addCompanyIdToFilters(exportDto, companyId);

    const customerModel = this.customersService.getModel();

    const result = await this.exportsService.exportData(
      customerModel,
      filteredExportDto,
      'customers',
      'Clientes',
      format,
      ['corporateName', 'fantasyName', 'cnpj', 'email', 'phoneNumber'],
      selectFields,
    );

    return {
      message: 'Arquivo de clientes gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Get('export/selectable-fields')
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('customers');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Get('batch')
  async findByIds(@Param('id') companyId: number, @Query('ids') ids: string) {
    const idArray = ids ? ids.split(',').map(Number).filter(Boolean) : [];
    const data = await this.customersService.findByIds(companyId, idArray);

    return {
      message: 'Clientes retornados com sucesso',
      data,
    };
  }

  @Get(':customerId')
  async findOne(
    @Param('id') companyId: number,
    @Param('customerId') customerId: number,
  ) {
    const customer = await this.customersService.findOne(companyId, customerId);

    return {
      message: 'Cliente retornado com sucesso',
      data: customer,
    };
  }

  @Get()
  async findAll(
    @Param('id') companyId: number,
    @Query() query: BaseFindAllDataDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const { data, metadata } = await this.customersService.findAll(
      companyId,
      query,
      user,
    );

    return {
      message: 'Clientes retornados com sucesso',
      data,
      metadata,
    };
  }

  @Patch(':customerId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateCustomer(
    @Param('id') companyId: number,
    @Param('customerId') customerId: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    const updatedCustomer = await this.customersService.updateCustomer(
      companyId,
      customerId,
      updateCustomerDto,
    );

    return {
      message: 'Cliente atualizado com sucesso',
      data: updatedCustomer,
    };
  }

  @Delete(':customerId')
  async deleteCustomer(
    @Param('id') companyId: number,
    @Param('customerId') customerId: number,
  ) {
    await this.customersService.deleteCustomer(companyId, customerId);

    return {
      message: 'Cliente removido com sucesso',
    };
  }

  @Post(':customerId/payment-condition/:paymentConditionId')
  async addPaymentCondition(
    @Param('id') companyId: number,
    @Param('customerId') customerId: number,
    @Param('paymentConditionId') paymentConditionId: number,
  ) {
    await this.customersService.addPaymentCondition(
      companyId,
      customerId,
      paymentConditionId,
    );

    return {
      message: 'Condição de pagamento adicionada com sucesso',
    };
  }

  @Delete(':customerId/payment-condition/:paymentConditionId')
  async removePaymentCondition(
    @Param('id') companyId: number,
    @Param('customerId') customerId: number,
    @Param('paymentConditionId') paymentConditionId: number,
  ) {
    await this.customersService.removePaymentCondition(
      companyId,
      customerId,
      paymentConditionId,
    );

    return {
      message: 'Condição de pagamento removida com sucesso',
    };
  }

  @Post(':customerId/payment-method/:paymentMethodId')
  async addPaymentMethod(
    @Param('id') companyId: number,
    @Param('customerId') customerId: number,
    @Param('paymentMethodId') paymentMethodId: number,
  ) {
    await this.customersService.addPaymentMethod(
      companyId,
      customerId,
      paymentMethodId,
    );

    return {
      message: 'Método de pagamento adicionado com sucesso',
    };
  }

  @Delete(':customerId/payment-method/:paymentMethodId')
  async removePaymentMethod(
    @Param('id') companyId: number,
    @Param('customerId') customerId: number,
    @Param('paymentMethodId') paymentMethodId: number,
  ) {
    await this.customersService.removePaymentMethod(
      companyId,
      customerId,
      paymentMethodId,
    );

    return {
      message: 'Método de pagamento removido com sucesso',
    };
  }

  @Get('by-group/:groupCode')
  async findCustomersByGroup(
    @Param('id') companyId: number,
    @Param('groupCode') groupCode: string,
  ) {
    const customers = await this.customersService.findCustomersByGroupCode(
      companyId,
      groupCode,
    );

    return {
      message: 'Clientes do grupo retornados com sucesso',
      data: customers,
    };
  }
}
