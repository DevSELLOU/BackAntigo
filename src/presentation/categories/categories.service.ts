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
import { SubCategory } from '../sub-categories/sub-category.entity';
import { CategoriesMapper } from './categories.mapper';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject(CategoriesMapper)
    private readonly categoriesMapper: CategoriesMapper,
    @Inject('CATEGORY_REPOSITORY')
    private categoriesRepository: typeof Category,
  ) {}

  getModel(): typeof Category {
    return Category;
  }

  async createCategory(
    companyId: number,
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    await this.companiesService.findOne(companyId);

    const categoryExists = await this.categoriesRepository.findOne({
      where: { name: createCategoryDto.name, companyId: companyId },
    });

    if (categoryExists)
      throw new NotFoundException('Categoria já cadastrada no sistema');

    const categoryMapped: Partial<Category> =
      await this.categoriesMapper.createCategoryDtoToCategory(
        createCategoryDto,
        companyId,
      );

    const category = await this.categoriesRepository.create(
      categoryMapped.dataValues,
    );

    return category;
  }

  async findOne(companyId: number, categoryId: number): Promise<Category> {
    await this.companiesService.findOne(companyId);

    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId, companyId: companyId },
      include: [{ model: SubCategory, as: 'subCategories' }],
    });

    if (!category) throw new NotFoundException('Categoria não encontrada');

    return category;
  }

  async findAll(
    companyId: number,
    findAllDto: BaseFindAllDataDto,
  ): Promise<{
    data: Category[];
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
          buildFullTextSearchWhere(['name', 'description'], query, 'Category'),
          Sequelize.where(
            Sequelize.cast(Sequelize.col('Category.id'), 'TEXT'),
            {
              [Op.iLike]: `%${query}%`,
            },
          ),
        ];
      }

      filterQuery.companyId = company.id;

      const total = await this.categoriesRepository.count({
        where: filterQuery,
      });

      const data = await this.categoriesRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        include: [{ model: SubCategory, as: 'subCategories' }],
        limit,
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

  async updateCategory(
    companyId: number,
    categoryId: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    await this.companiesService.findOne(companyId);

    const category = await this.findOne(companyId, categoryId);

    const categoryExists = await this.categoriesRepository.findOne({
      where: { name: updateCategoryDto.name, companyId: companyId },
    });

    if (categoryExists && category.name !== updateCategoryDto.name)
      throw new NotFoundException('Categoria já cadastrada no sistema');

    const categoryMapped =
      await this.categoriesMapper.updateCategoryDtoToCategory(
        category,
        updateCategoryDto,
      );

    await category.update(categoryMapped);
    await category.save();
    return category;
  }

  async deleteCategory(companyId: number, categoryId: number): Promise<void> {
    await this.companiesService.findOne(companyId);

    const category = await this.findOne(companyId, categoryId);

    await category.destroy();
  }
}
