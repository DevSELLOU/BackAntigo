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
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { ExportDataDto, ExportFormat } from 'src/exports/dtos/export-data.dto';
import { ExportsService } from 'src/exports/exports.service';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { addCompanyIdToFilters } from 'src/utils/filter-utils';
import { Multer } from 'multer';
import { CreatePaymentMethodDto } from './dtos/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dtos/update-payment-method.dto';
import { PaymentMethodsService } from './payment-methods.service';

@ApiTags('payment-methods')
@Controller('company/:id/payment-method')
@ApiBearerAuth()
export class PaymentMethodsController {
  constructor(
    private readonly paymentMethodsService: PaymentMethodsService,
    @Inject(ExportsService) private readonly exportsService: ExportsService,
  ) {}

  @Post()
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createPaymentMethod(
    @Param('id') companyId: number,
    @Body() createPaymentMethodDto: CreatePaymentMethodDto,
  ) {
    const createdPaymentMethod =
      await this.paymentMethodsService.createPaymentMethod(
        createPaymentMethodDto,
        companyId,
      );

    return {
      message: 'Condição de Pagamento criada com sucesso',
      data: createdPaymentMethod,
    };
  }

  @Post('import')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @UseInterceptors(FileInterceptor('file'))
  async importPaymentMethods(
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
    const result = await this.paymentMethodsService.importFromCSV(
      companyId,
      file.buffer,
      mode,
    );

    return {
      message: `${result.count} métodos de pagamento foram processados com sucesso.`,
      data: result,
    };
  }

  @Get('export')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  async exportPaymentMethods(
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

    const paymentMethodModel = this.paymentMethodsService.getModel();

    const result = await this.exportsService.exportData(
      paymentMethodModel,
      filteredExportDto,
      'paymentMethods',
      'Métodos de Pagamento',
      format,
      ['name', 'description'],
      selectFields,
    );

    return {
      message: 'Arquivo de métodos de pagamento gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Get('export/selectable-fields')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('paymentMethods');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Get(':paymentMethodId')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  async findOne(
    @Param('id') companyId: number,
    @Param('paymentMethodId') paymentMethodId: number,
  ) {
    const paymentMethod = await this.paymentMethodsService.findOne(
      companyId,
      paymentMethodId,
    );

    return {
      message: 'Condição de Pagamento retornada com sucesso',
      data: paymentMethod,
    };
  }

  @Get()
  @Public()
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  async findAll(
    @Param('id') companyId: number,
    @Query() query: BaseFindAllDataDto,
    @Query('customerId') customerId?: number,
  ) {
    const { data, metadata } = await this.paymentMethodsService.findAll(
      companyId,
      query,
      customerId,
    );

    return {
      message: 'Condições de Pagamento retornados com sucesso',
      data,
      metadata,
    };
  }

  @Patch(':paymentMethodId')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updatePaymentMethod(
    @Param('id') companyId: number,
    @Param('paymentMethodId') paymentMethodId: number,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ) {
    const updatedPaymentMethod =
      await this.paymentMethodsService.updatePaymentMethod(
        companyId,
        paymentMethodId,
        updatePaymentMethodDto,
      );

    return {
      message: 'Condição de Pagamento atualizada com sucesso',
      data: updatedPaymentMethod,
    };
  }

  @Delete(':paymentMethodId')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  async deletePaymentMethod(
    @Param('id') companyId: number,
    @Param('paymentMethodId') paymentMethodId: number,
  ) {
    await this.paymentMethodsService.deletePaymentMethod(
      companyId,
      paymentMethodId,
    );

    return {
      message: 'Condição de Pagamento removida com sucesso',
    };
  }
}
