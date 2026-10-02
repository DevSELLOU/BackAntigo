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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@ApiTags('categories')
@Controller('company/:id/categories')
@ApiBearerAuth()
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    @Inject(ExportsService)
    private readonly exportsService: ExportsService,
  ) {}

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createCategory(
    @Param('id') companyId: number,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const createdCategory = await this.categoriesService.createCategory(
      companyId,
      createCategoryDto,
    );

    return {
      message: 'Categoria criada com sucesso',
      data: createdCategory,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Get('export')
  async exportCategories(
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

    const categoryModel = this.categoriesService.getModel();

    const result = await this.exportsService.exportData(
      categoryModel,
      filteredExportDto,
      'categories',
      'Categorias',
      format,
      ['name', 'description'],
      selectFields,
    );

    return {
      message: 'Arquivo de categorias gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Get('export/selectable-fields')
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('categories');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Get(':categoryId')
  async findOne(
    @Param('id') companyId: number,
    @Param('categoryId') categoryId: number,
  ) {
    const category = await this.categoriesService.findOne(
      companyId,
      categoryId,
    );

    return {
      message: 'Categoria retornada com sucesso',
      data: category,
    };
  }

  @Public()
  @Get()
  async findAll(
    @Param('id') companyId: number,
    @Query() query: BaseFindAllDataDto,
  ) {
    const { data, metadata } = await this.categoriesService.findAll(
      companyId,
      query,
    );

    return {
      message: 'Categorias retornadas com sucesso',
      data,
      metadata,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Patch(':categoryId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateCategory(
    @Param('id') companyId: number,
    @Param('categoryId') categoryId: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const updatedCategory = await this.categoriesService.updateCategory(
      companyId,
      categoryId,
      updateCategoryDto,
    );

    return {
      message: 'Categoria atualizada com sucesso',
      data: updatedCategory,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Delete(':categoryId')
  async deleteCategory(
    @Param('id') companyId: number,
    @Param('categoryId') categoryId: number,
  ) {
    await this.categoriesService.deleteCategory(companyId, categoryId);

    return {
      message: 'Categoria removida com sucesso',
    };
  }
}
