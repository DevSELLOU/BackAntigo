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
import { CreatePaymentConditionDto } from './dtos/create-payment-condition.dto';
import { UpdatePaymentConditionDto } from './dtos/update-payment-condition.dto';
import { PaymentConditionsService } from './payment-conditions.service';

@ApiTags('payment-conditions')
@Controller('company/:id/payment-condition')
@ApiBearerAuth()
export class PaymentConditionsController {
  constructor(
    private readonly paymentConditionsService: PaymentConditionsService,
    @Inject(ExportsService)
    private readonly exportsService: ExportsService,
  ) {}
  @Post()
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createPaymentCondition(
    @Param('id') companyId: number,
    @Body() createPaymentConditionDto: CreatePaymentConditionDto,
  ) {
    const createdPaymentCondition =
      await this.paymentConditionsService.createPaymentCondition(
        createPaymentConditionDto,
        companyId,
      );

    return {
      message: 'Condição de Pagamento criada com sucesso',
      data: createdPaymentCondition,
    };
  }

  @Post('import')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @UseInterceptors(FileInterceptor('file'))
  async importPaymentConditions(
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
    const result = await this.paymentConditionsService.importFromCSV(
      companyId,
      file.buffer,
      mode,
    );

    return {
      message: `${result.count} condições de pagamento foram processadas com sucesso.`,
      data: result,
    };
  }

  @Get('export')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  async exportPaymentConditions(
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

    const paymentConditionModel = this.paymentConditionsService.getModel();

    const result = await this.exportsService.exportData(
      paymentConditionModel,
      filteredExportDto,
      'paymentConditions',
      'Condições de Pagamento',
      format,
      ['name', 'description'],
      selectFields,
    );

    return {
      message: 'Arquivo de condições de pagamento gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Get('export/selectable-fields')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('paymentConditions');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Get(':paymentConditionId')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  async findOne(
    @Param('id') companyId: number,
    @Param('paymentConditionId') paymentConditionId: number,
  ) {
    const paymentCondition = await this.paymentConditionsService.findOne(
      companyId,
      paymentConditionId,
    );

    return {
      message: 'Condição de Pagamento retornada com sucesso',
      data: paymentCondition,
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
    const { data, metadata } = await this.paymentConditionsService.findAll(
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

  @Patch(':paymentConditionId')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updatePaymentCondition(
    @Param('id') companyId: number,
    @Param('paymentConditionId') paymentConditionId: number,
    @Body() updatePaymentConditionDto: UpdatePaymentConditionDto,
  ) {
    const updatedPaymentCondition =
      await this.paymentConditionsService.updatePaymentCondition(
        companyId,
        paymentConditionId,
        updatePaymentConditionDto,
      );

    return {
      message: 'Condição de Pagamento atualizada com sucesso',
      data: updatedPaymentCondition,
    };
  }

  @Delete(':paymentConditionId')
  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  async deletePaymentCondition(
    @Param('id') companyId: number,
    @Param('paymentConditionId') paymentConditionId: number,
  ) {
    await this.paymentConditionsService.deletePaymentCondition(
      companyId,
      paymentConditionId,
    );

    return {
      message: 'Condição de Pagamento removida com sucesso',
    };
  }
}
