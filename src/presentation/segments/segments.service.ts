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
import { SubSegment } from '../sub-segments/sub-segment.entity';
import { CreateSegmentDto } from './dtos/create-segment.dto';
import { UpdateSegmentDto } from './dtos/update-segment.dto';
import { Segment } from './segment.entity';
import { SegmentsMapper } from './segments.mapper';

@Injectable()
export class SegmentsService {
  constructor(
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject(SegmentsMapper)
    private readonly segmentsMapper: SegmentsMapper,
    @Inject('SEGMENT_REPOSITORY')
    private segmentsRepository: typeof Segment,
  ) {}

  getModel() {
    return this.segmentsRepository;
  }

  async createSegment(
    companyId: number,
    createSegmentDto: CreateSegmentDto,
  ): Promise<Segment> {
    await this.companiesService.findOne(companyId);

    const segmentExists = await this.segmentsRepository.findOne({
      where: { name: createSegmentDto.name, companyId: companyId },
    });

    if (segmentExists)
      throw new NotFoundException('Segmento já cadastrado no sistema');

    const segmentMapped: Partial<Segment> =
      await this.segmentsMapper.createSegmentDtoToSegment(
        createSegmentDto,
        companyId,
      );

    const segment = await this.segmentsRepository.create(
      segmentMapped.dataValues,
    );

    return segment;
  }

  async findOne(companyId: number, segmentId: number): Promise<Segment> {
    await this.companiesService.findOne(companyId);

    const segment = await this.segmentsRepository.findOne({
      where: { id: segmentId, companyId: companyId },
      include: [{ model: SubSegment, as: 'subSegments' }],
    });

    if (!segment) throw new NotFoundException('Segmento não encontrado');

    return segment;
  }

  async findAll(
    companyId: number,
    findAllDto: BaseFindAllDataDto,
  ): Promise<{
    data: Segment[];
    metadata: { page: number; limit: number; total: number };
  }> {
    try {
      const company = await this.companiesService.findOne(companyId);
      const { page = 1, limit = 10, sort, filters, query } = findAllDto;

      const parsedFilters = filters ? JSON.parse(filters) : {};
      const parsedSort = sort ? JSON.parse(sort) : {};

      const filterQuery = buildFilterQuery(parsedFilters);
      const sortQuery = buildSortQuery(parsedSort);

      if (query) {
        filterQuery[Op.or] = [
          buildFullTextSearchWhere(['name', 'description'], query, 'Segment'),
          Sequelize.where(Sequelize.cast(Sequelize.col('Segment.id'), 'TEXT'), {
            [Op.iLike]: `%${query}%`,
          }),
        ];
      }

      filterQuery.companyId = company.id;

      const total = await this.segmentsRepository.count({
        where: filterQuery,
      });

      const data = await this.segmentsRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        limit,
        include: [{ model: SubSegment, as: 'subSegments' }],
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

  async updateSegment(
    companyId: number,
    segmentId: number,
    updateSegmentDto: UpdateSegmentDto,
  ): Promise<Segment> {
    await this.companiesService.findOne(companyId);

    const segment = await this.findOne(companyId, segmentId);

    if (updateSegmentDto.name) {
      const segmentExists = await this.segmentsRepository.findOne({
        where: { name: updateSegmentDto.name, companyId: companyId },
      });

      if (segmentExists && segment.name !== updateSegmentDto.name)
        throw new NotFoundException('Segmento já cadastrado no sistema');
    }

    const segmentMapped = await this.segmentsMapper.updateSegmentDtoToSegment(
      segment,
      updateSegmentDto,
    );

    await segment.update(segmentMapped);
    await segment.save();
    return segment;
  }

  async deleteSegment(companyId: number, segmentId: number): Promise<void> {
    await this.companiesService.findOne(companyId);

    const segment = await this.findOne(companyId, segmentId);

    await segment.destroy();
  }
}
