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
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { CreateSubCategoryDto } from './dtos/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dtos/update-sub-category.dto';
import { SubCategoriesService } from './sub-categories.service';

@ApiTags('sub-categories')
@Controller('company/:companyId/categories/:categoryId/sub-categories')
@ApiBearerAuth()
export class SubCategoriesController {
  constructor(private readonly subCategoriesService: SubCategoriesService) {}

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createSubCategory(
    @Param('companyId') companyId: number,
    @Param('categoryId') categoryId: number,
    @Body() createSubCategoryDto: CreateSubCategoryDto,
  ) {
    const createdSubCategory =
      await this.subCategoriesService.createSubCategory(
        companyId,
        categoryId,
        createSubCategoryDto,
      );

    return {
      message: 'Sub Categoria criada com sucesso',
      data: createdSubCategory,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Get(':subCategoryId')
  async findOne(
    @Param('companyId') companyId: number,
    @Param('categoryId') categoryId: number,
    @Param('subCategoryId') subCategoryId: number,
  ) {
    const foundSubCategory = await this.subCategoriesService.findOne(
      companyId,
      categoryId,
      subCategoryId,
    );

    return {
      message: 'Sub Categoria retornada com sucesso',
      data: foundSubCategory,
    };
  }

  @Public()
  @Get()
  async findAll(
    @Param('companyId') companyId: number,
    @Param('categoryId') categoryId: number,
    @Query() query: BaseFindAllDataDto,
  ) {
    const { data, metadata } = await this.subCategoriesService.findAll(
      companyId,
      categoryId,
      query,
    );

    return {
      message: 'Categorias retornadas com sucesso',
      data,
      metadata,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Patch(':subCategoryId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateSubCategory(
    @Param('companyId') companyId: number,
    @Param('categoryId') categoryId: number,
    @Param('subCategoryId') subCategoryId: number,
    @Body() updateSubCategoryDto: UpdateSubCategoryDto,
  ) {
    const updatedSubCategory =
      await this.subCategoriesService.updateSubCategory(
        companyId,
        categoryId,
        subCategoryId,
        updateSubCategoryDto,
      );

    return {
      message: 'Sub Categoria atualizada com sucesso',
      data: updatedSubCategory,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
  @Delete(':subCategoryId')
  async deleteSubCategory(
    @Param('companyId') companyId: number,
    @Param('categoryId') categoryId: number,
    @Param('subCategoryId', ParseIntPipe) subCategoryId: number,
  ) {
    await this.subCategoriesService.deleteSubCategory(
      companyId,
      categoryId,
      subCategoryId,
    );

    return {
      message: 'Sub Categoria removida com sucesso',
    };
  }
}
