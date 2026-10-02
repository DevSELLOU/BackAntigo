import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { CompaniesService } from 'src/companies/companies.service';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { buildFilterQuery, buildSortQuery } from 'src/utils/query-utils';
import { buildFullTextSearchWhere } from 'src/utils/fulltext-utils';
import { Segment } from '../segments/segment.entity';
import { SegmentsService } from '../segments/segments.service';
import { CreateSubSegmentDto } from './dtos/create-sub-segment.dto';
import { UpdateSubSegmentDto } from './dtos/update-sub-segment.dto';
import { SubSegment } from './sub-segment.entity';
import { SubSegmentsMapper } from './sub-segments.mapper';

@Injectable()
export class SubSegmentsService {
  constructor(
    @Inject(SubSegmentsMapper)
    private readonly subSegmentsMapper: SubSegmentsMapper,
    @Inject(SegmentsService)
    private readonly segmentsService: SegmentsService,
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject('SUB_SEGMENT_REPOSITORY')
    private subSegmentsRepository: typeof SubSegment,
  ) {}

  async createSubSegment(
    companyId: number,
    segmentId: number,
    createSubSegmentDto: CreateSubSegmentDto,
  ): Promise<SubSegment> {
    await this.companiesService.findOne(companyId);
    await this.segmentsService.findOne(companyId, segmentId);

    const subSegmentExists = await this.subSegmentsRepository.findOne({
      where: { name: createSubSegmentDto.name, segmentId: segmentId },
    });

    if (subSegmentExists)
      throw new NotFoundException('Sub Segmento já cadastrado no sistema');

    const subSegmentMapped: Partial<SubSegment> =
      await this.subSegmentsMapper.createSubSegmentDtoToSubSegment(
        createSubSegmentDto,
        segmentId,
      );

    const subSegment = await this.subSegmentsRepository.create(
      subSegmentMapped.dataValues,
    );

    return subSegment;
  }

  async findOne(
    companyId: number,
    segmentId: number,
    subSegmentId: number,
  ): Promise<SubSegment> {
    await this.companiesService.findOne(companyId);
    await this.segmentsService.findOne(companyId, segmentId);

    const subSegment = await this.subSegmentsRepository.findOne({
      where: { id: subSegmentId, segmentId: segmentId },
      include: [Segment],
    });

    if (!subSegment) throw new NotFoundException('Sub Segmento não encontrado');

    return subSegment;
  }

  async findAll(
    companyId: number,
    segmentId: number,
    findAllDto: BaseFindAllDataDto,
  ): Promise<{
    data: SubSegment[];
    metadata: { page: number; limit: number; total: number };
  }> {
    try {
      const company = await this.companiesService.findOne(companyId);
      const segment = await this.segmentsService.findOne(companyId, segmentId);
      const { page = 1, limit = 10, sort, filters, query } = findAllDto;

      const parsedFilters = filters ? JSON.parse(filters) : {};
      const parsedSort = sort ? JSON.parse(sort) : {};

      const filterQuery = buildFilterQuery(parsedFilters);
      const sortQuery = buildSortQuery(parsedSort);

      if (query) {
        filterQuery[Op.or] = [
          buildFullTextSearchWhere(['name'], query, 'SubSegment'),
          Sequelize.where(
            Sequelize.cast(Sequelize.col('SubSegment.id'), 'TEXT'),
            {
              [Op.iLike]: `%${query}%`,
            },
          ),
        ];
      }

      filterQuery.segmentId = segment.id;

      const total = await this.subSegmentsRepository.count({
        where: filterQuery,
      });

      const data = await this.subSegmentsRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        limit,
        include: [Segment],
      });

      return {
        data,
        metadata: { page, limit, total },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Erro ao buscar: ${error.message}`,
      );
    }
  }

  async updateSubSegment(
    companyId: number,
    segmentId: number,
    subSegmentId: number,
    updateSubSegmentDto: UpdateSubSegmentDto,
  ): Promise<SubSegment> {
    await this.companiesService.findOne(companyId);
    await this.segmentsService.findOne(companyId, segmentId);

    const subSegment = await this.findOne(companyId, segmentId, subSegmentId);

    if (updateSubSegmentDto.name) {
      const subSegmentExists = await this.subSegmentsRepository.findOne({
        where: { name: updateSubSegmentDto.name, segmentId: segmentId },
      });

      if (subSegmentExists && subSegment.name !== updateSubSegmentDto.name)
        throw new NotFoundException('Sub Segmento já cadastrado no sistema');
    }

    const subSegmentMapped =
      await this.subSegmentsMapper.updateSubSegmentDtoToSubSegment(
        subSegment,
        updateSubSegmentDto,
      );

    await subSegment.update(subSegmentMapped);
    await subSegment.save();
    return subSegment;
  }

  async deleteSubSegment(
    companyId: number,
    segmentId: number,
    subSegmentId: number,
  ): Promise<void> {
    await this.companiesService.findOne(companyId);
    await this.segmentsService.findOne(companyId, segmentId);

    const subSegment = await this.findOne(companyId, segmentId, subSegmentId);

    await subSegment.destroy();
  }

  async findAllByIds(ids: number[]): Promise<SubSegment[]> {
    return await this.subSegmentsRepository.findAll({
      where: { id: ids },
    });
  }
}
