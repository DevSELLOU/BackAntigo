import {
  Body,
  Controller,
  Delete,
  Get,
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
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { CreateSubSegmentDto } from './dtos/create-sub-segment.dto';
import { UpdateSubSegmentDto } from './dtos/update-sub-segment.dto';
import { SubSegmentsService } from './sub-segments.service';

@ApiTags('sub-segments')
@Controller('company/:companyId/segments/:segmentId/sub-segments')
@ApiBearerAuth()
@Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
export class SubSegmentsController {
  constructor(private readonly subSegmentsService: SubSegmentsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createSubSegment(
    @Param('companyId') companyId: number,
    @Param('segmentId') segmentId: number,
    @Body() createSubSegmentDto: CreateSubSegmentDto,
  ) {
    const createdSubSegment = await this.subSegmentsService.createSubSegment(
      companyId,
      segmentId,
      createSubSegmentDto,
    );

    return {
      message: 'Sub Segmento criado com sucesso',
      data: createdSubSegment,
    };
  }

  @Get(':subSegmentId')
  async findOne(
    @Param('companyId') companyId: number,
    @Param('segmentId') segmentId: number,
    @Param('subSegmentId') subSegmentId: number,
  ) {
    const foundSubSegment = await this.subSegmentsService.findOne(
      companyId,
      segmentId,
      subSegmentId,
    );

    return {
      message: 'Sub Segmento retornado com sucesso',
      data: foundSubSegment,
    };
  }

  @Get()
  async findAll(
    @Param('companyId') companyId: number,
    @Param('segmentId') segmentId: number,
    @Query() query: BaseFindAllDataDto,
  ) {
    const { data, metadata } = await this.subSegmentsService.findAll(
      companyId,
      segmentId,
      query,
    );

    return {
      message: 'Segmentos retornados com sucesso',
      data,
      metadata,
    };
  }

  @Patch(':subSegmentId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateSubSegment(
    @Param('companyId') companyId: number,
    @Param('segmentId') segmentId: number,
    @Param('subSegmentId') subSegmentId: number,
    @Body() updateSubSegmentDto: UpdateSubSegmentDto,
  ) {
    const updatedSubSegment = await this.subSegmentsService.updateSubSegment(
      companyId,
      segmentId,
      subSegmentId,
      updateSubSegmentDto,
    );

    return {
      message: 'Sub Segmento atualizado com sucesso',
      data: updatedSubSegment,
    };
  }

  @Delete(':subSegmentId')
  async deleteSubSegment(
    @Param('companyId') companyId: number,
    @Param('segmentId') segmentId: number,
    @Param('subSegmentId', ParseIntPipe) subSegmentId: number,
  ) {
    await this.subSegmentsService.deleteSubSegment(
      companyId,
      segmentId,
      subSegmentId,
    );

    return {
      message: 'Sub Segmento removido com sucesso',
    };
  }
}
