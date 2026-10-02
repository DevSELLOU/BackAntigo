import { Injectable } from '@nestjs/common';
import { CreateSubCategoryDto } from './dtos/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dtos/update-sub-category.dto';
import { SubCategory } from './sub-category.entity';

@Injectable()
export class SubCategoriesMapper {
  constructor() {}

  async createSubCategoryDtoToSubCategory(
    createSubCategoryDto: CreateSubCategoryDto,
    categoryId: number,
  ): Promise<SubCategory> {
    const subCategory = new SubCategory();
    subCategory.name = createSubCategoryDto.name;
    subCategory.categoryId = categoryId;

    return subCategory;
  }

  async updateSubCategoryDtoToSubCategory(
    currentSubCategory: SubCategory,
    updateSubCategoryDto: UpdateSubCategoryDto,
  ): Promise<SubCategory> {
    if (updateSubCategoryDto.name)
      currentSubCategory.name = updateSubCategoryDto.name;

    return currentSubCategory;
  }
}
