import { Injectable } from '@nestjs/common';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@Injectable()
export class CategoriesMapper {
  constructor() {}

  async createCategoryDtoToCategory(
    createCategoryDto: CreateCategoryDto,
    companyId: number,
  ): Promise<Category> {
    const category = new Category();
    category.name = createCategoryDto.name;
    category.description = createCategoryDto.description;
    category.companyId = companyId;

    return category;
  }

  async updateCategoryDtoToCategory(
    currentCategory: Category,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    if (updateCategoryDto.name) currentCategory.name = updateCategoryDto.name;

    if (updateCategoryDto.description)
      currentCategory.description = updateCategoryDto.description;

    return currentCategory;
  }
}
