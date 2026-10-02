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
import { CategoriesService } from '../categories/categories.service';
import { Category } from '../categories/category.entity';
import { CreateSubCategoryDto } from './dtos/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dtos/update-sub-category.dto';
import { SubCategoriesMapper } from './sub-categories.mapper';
import { SubCategory } from './sub-category.entity';

@Injectable()
export class SubCategoriesService {
  constructor(
    @Inject(SubCategoriesMapper)
    private readonly subCategoriesMapper: SubCategoriesMapper,
    @Inject(CategoriesService)
    private readonly categoriesService: CategoriesService,
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject('SUB_CATEGORY_REPOSITORY')
    private subCategoriesRepository: typeof SubCategory,
  ) {}

  async createSubCategory(
    companyId: number,
    categoryId: number,
    createSubCategoryDto: CreateSubCategoryDto,
  ): Promise<SubCategory> {
    await this.companiesService.findOne(companyId);
    await this.categoriesService.findOne(companyId, categoryId);

    const subCategoryExists = await this.subCategoriesRepository.findOne({
      where: { name: createSubCategoryDto.name, categoryId: categoryId },
    });

    if (subCategoryExists)
      throw new NotFoundException('Sub Categoria já cadastrada no sistema');

    const subCategoryMapped: Partial<SubCategory> =
      await this.subCategoriesMapper.createSubCategoryDtoToSubCategory(
        createSubCategoryDto,
        categoryId,
      );

    const subCategory = await this.subCategoriesRepository.create(
      subCategoryMapped.dataValues,
    );

    return subCategory;
  }

  async findOne(
    companyId: number,
    categoryId: number,
    subCategoryId: number,
  ): Promise<SubCategory> {
    await this.companiesService.findOne(companyId);
    await this.categoriesService.findOne(companyId, categoryId);

    const subCategory = await this.subCategoriesRepository.findOne({
      where: { id: subCategoryId, categoryId: categoryId },
      include: [Category],
    });

    if (!subCategory)
      throw new NotFoundException('Sub Categoria não encontrada');

    return subCategory;
  }

  async findAll(
    companyId: number,
    categoryId: number,
    findAllDto: BaseFindAllDataDto,
  ): Promise<{
    data: SubCategory[];
    metadata: { page: number; limit: number; total: number };
  }> {
    try {
      const company = await this.companiesService.findOne(companyId);
      const category = await this.categoriesService.findOne(
        companyId,
        categoryId,
      );
      const { page = 1, limit = 10, sort, filters, query } = findAllDto;

      const parsedFilters = filters ? JSON.parse(filters) : {};
      const parsedSort = sort ? JSON.parse(sort) : {};

      const filterQuery = buildFilterQuery(parsedFilters);
      const sortQuery = buildSortQuery(parsedSort);

      if (query) {
        filterQuery[Op.or] = [
          buildFullTextSearchWhere(['name'], query, 'SubCategory'),
          Sequelize.where(
            Sequelize.cast(Sequelize.col('SubCategory.id'), 'TEXT'),
            {
              [Op.iLike]: `%${query}%`,
            },
          ),
        ];
      }

      filterQuery.categoryId = category.id;

      const total = await this.subCategoriesRepository.count({
        where: filterQuery,
      });

      const data = await this.subCategoriesRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        limit,
        include: [Category],
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

  async updateSubCategory(
    companyId: number,
    categoryId: number,
    subCategoryId: number,
    updateSubCategoryDto: UpdateSubCategoryDto,
  ): Promise<SubCategory> {
    await this.companiesService.findOne(companyId);
    await this.categoriesService.findOne(companyId, categoryId);

    const subCategory = await this.findOne(
      companyId,
      categoryId,
      subCategoryId,
    );

    const subCategoryExists = await this.subCategoriesRepository.findOne({
      where: { name: updateSubCategoryDto.name, categoryId: categoryId },
    });

    if (subCategoryExists && subCategory.name !== updateSubCategoryDto.name)
      throw new NotFoundException('Sub Categoria já cadastrada no sistema');

    const subCategoryMapped =
      await this.subCategoriesMapper.updateSubCategoryDtoToSubCategory(
        subCategory,
        updateSubCategoryDto,
      );

    await subCategory.update(subCategoryMapped);
    await subCategory.save();
    return subCategory;
  }

  async deleteSubCategory(
    companyId: number,
    categoryId: number,
    subCategoryId: number,
  ): Promise<void> {
    await this.companiesService.findOne(companyId);
    await this.categoriesService.findOne(companyId, categoryId);

    const subCategory = await this.findOne(
      companyId,
      categoryId,
      subCategoryId,
    );

    await subCategory.destroy();
  }

  async findAllByIds(ids: number[]): Promise<SubCategory[]> {
    return await this.subCategoriesRepository.findAll({
      where: { id: ids },
    });
  }
}
