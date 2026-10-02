import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
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
import { AccessRequestsService } from './access-requests.service';
import { UpdateAccessRequestStatusDto } from './dtos/update-access-request-status.dto';

@ApiTags('access-requests')
@Controller('company/:companyId/access-requests')
@Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
@ApiBearerAuth()
export class AccessRequestsController {
  constructor(
    @Inject(AccessRequestsService)
    private readonly accessRequestsService: AccessRequestsService,
    @Inject(ExportsService)
    private readonly exportsService: ExportsService,
  ) {}

  @Get('export')
  async exportAccessRequests(
    @Param('companyId') companyId: number,
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

    const accessRequestModel = this.accessRequestsService.getModel();

    const result = await this.exportsService.exportData(
      accessRequestModel,
      filteredExportDto,
      'accessRequests',
      'Solicitações de Acesso',
      format,
      ['fullName', 'email', 'companyName', 'cnpj'],
      selectFields,
    );

    return {
      message: 'Arquivo de solicitações de acesso gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Get('export/selectable-fields')
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('accessRequests');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Get()
  async findAll(
    @Param('companyId') companyId: number,
    @Query() query: BaseFindAllDataDto,
  ) {
    const { data, metadata } = await this.accessRequestsService.findAll(
      companyId,
      query,
    );

    return {
      message: 'Solicitações de acesso retornadas com sucesso',
      data,
      metadata,
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('companyId') companyId: number,
    @Param('id') id: number,
    @Body() updateStatusDto: UpdateAccessRequestStatusDto,
  ) {
    const updatedAccessRequest = await this.accessRequestsService.updateStatus(
      companyId,
      id,
      updateStatusDto,
    );

    return {
      message: 'Solicitação de acesso atualizada com sucesso',
      data: updatedAccessRequest,
    };
  }
}
