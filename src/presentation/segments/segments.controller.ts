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
import { CreateSegmentDto } from './dtos/create-segment.dto';
import { UpdateSegmentDto } from './dtos/update-segment.dto';
import { SegmentsService } from './segments.service';

@ApiTags('segments')
@Controller('company/:id/segments')
@Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
@ApiBearerAuth()
export class SegmentsController {
  constructor(
    private readonly segmentsService: SegmentsService,
    @Inject(ExportsService)
    private readonly exportsService: ExportsService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createSegment(
    @Param('id') companyId: number,
    @Body() createSegmentDto: CreateSegmentDto,
  ) {
    const createdSegment = await this.segmentsService.createSegment(
      companyId,
      createSegmentDto,
    );

    return {
      message: 'Segmento criado com sucesso',
      data: createdSegment,
    };
  }

  @Get('export')
  async exportSegments(
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

    const segmentModel = this.segmentsService.getModel();

    const result = await this.exportsService.exportData(
      segmentModel,
      filteredExportDto,
      'segments',
      'Segmentos',
      format,
      ['name', 'description'],
      selectFields,
    );

    return {
      message: 'Arquivo de segmentos gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Get('export/selectable-fields')
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('segments');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Get(':segmentId')
  async findOne(
    @Param('id') companyId: number,
    @Param('segmentId') segmentId: number,
  ) {
    const segment = await this.segmentsService.findOne(companyId, segmentId);

    return {
      message: 'Segmento retornada com sucesso',
      data: segment,
    };
  }

  @Get()
  async findAll(
    @Param('id') companyId: number,
    @Query() query: BaseFindAllDataDto,
  ) {
    const { data, metadata } = await this.segmentsService.findAll(
      companyId,
      query,
    );

    return {
      message: 'Segmentos retornados com sucesso',
      data,
      metadata,
    };
  }

  @Patch(':segmentId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateSegment(
    @Param('id') companyId: number,
    @Param('segmentId') segmentId: number,
    @Body() updateSegmentDto: UpdateSegmentDto,
  ) {
    const updatedSegment = await this.segmentsService.updateSegment(
      companyId,
      segmentId,
      updateSegmentDto,
    );

    return {
      message: 'Segmento atualizado com sucesso',
      data: updatedSegment,
    };
  }

  @Delete(':segmentId')
  async deleteSegment(
    @Param('id') companyId: number,
    @Param('segmentId') segmentId: number,
  ) {
    await this.segmentsService.deleteSegment(companyId, segmentId);

    return {
      message: 'Segmento removido com sucesso',
    };
  }
}
