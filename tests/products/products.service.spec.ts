import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../../src/presentation/products/products.service';
import { CompaniesService } from '../../src/companies/companies.service';
import { UploadsService } from '../../src/uploads/uploads.service';
import { StockMovementService } from '../../src/presentation/stock-movement/stock-movement.service';
import { ProductsMapper } from '../../src/presentation/products/products.mapper';
import { Product } from '../../src/presentation/products/entities/product.entity';
import { Company } from '../../src/companies/company.entity';
import { CompanyStatus } from '../../src/companies/enums/company-status.enum';
import { SubCategory } from '../../src/presentation/sub-categories/sub-category.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let companiesService: jest.Mocked<CompaniesService>;

  const mockCompany: Partial<Company> = {
    id: 10,
    corporateName: 'Test Company',
    status: CompanyStatus.Active,
  };

  const mockSubCategories: Partial<SubCategory>[] = [
    { id: 2, name: 'SubCategory 1', categoryId: 2 },
    { id: 3, name: 'SubCategory 2', categoryId: 2 },
  ];

  const mockProduct: Partial<Product> = {
    id: 1,
    name: 'Test Product',
    companyId: 10,
    active: true,
    favorite: false,
    photos: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: CompaniesService, useValue: { findOne: jest.fn() } },
        { provide: UploadsService, useValue: { getPresignedGetUrl: jest.fn().mockResolvedValue('https://mock.url/photo.jpg') } },
        { provide: StockMovementService, useValue: { create: jest.fn() } },
        { provide: ProductsMapper, useValue: { createProductDtoToProduct: jest.fn(), updateProductDtoToProduct: jest.fn() } },
        { provide: 'PRODUCT_REPOSITORY', useValue: { findAll: jest.fn(), count: jest.fn() } },
        { provide: 'SUB_CATEGORY_REPOSITORY', useValue: { findAll: jest.fn() } },
        { provide: 'PRODUCT_PHOTO_REPOSITORY', useValue: { findAll: jest.fn() } },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    companiesService = module.get(CompaniesService);
  });

  describe('findAll with category filters', () => {
    it('should filter products by categoryId', async () => {
      companiesService.findOne.mockResolvedValue(mockCompany as Company);

      const subCategoriesRepository = service['subCategoriesRepository'];
      (subCategoriesRepository.findAll as jest.Mock).mockResolvedValue(mockSubCategories);

      const productsRepository = service['productsRepository'];
      (productsRepository.count as jest.Mock).mockResolvedValue(1);
      (productsRepository.findAll as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await service.findAll(10, {
        filters: JSON.stringify({ categoryId: 2 }),
        page: 1,
        limit: 50,
      });

      expect(result.data).toHaveLength(1);
      expect(companiesService.findOne).toHaveBeenCalledWith(10);
    });

    it('should filter products by subCategoryId', async () => {
      companiesService.findOne.mockResolvedValue(mockCompany as Company);

      const productsRepository = service['productsRepository'];
      (productsRepository.count as jest.Mock).mockResolvedValue(1);
      (productsRepository.findAll as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await service.findAll(10, {
        filters: JSON.stringify({ subCategoryId: 2 }),
        page: 1,
        limit: 50,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should combine categoryId filter with other filters', async () => {
      companiesService.findOne.mockResolvedValue(mockCompany as Company);

      const subCategoriesRepository = service['subCategoriesRepository'];
      (subCategoriesRepository.findAll as jest.Mock).mockResolvedValue(mockSubCategories);

      const productsRepository = service['productsRepository'];
      (productsRepository.count as jest.Mock).mockResolvedValue(1);
      (productsRepository.findAll as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await service.findAll(10, {
        filters: JSON.stringify({ categoryId: 2, active: true }),
        page: 1,
        limit: 50,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should return empty array when no subcategories found for category', async () => {
      companiesService.findOne.mockResolvedValue(mockCompany as Company);

      const subCategoriesRepository = service['subCategoriesRepository'];
      (subCategoriesRepository.findAll as jest.Mock).mockResolvedValue([]);

      const productsRepository = service['productsRepository'];
      (productsRepository.count as jest.Mock).mockResolvedValue(0);
      (productsRepository.findAll as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(10, {
        filters: JSON.stringify({ categoryId: 999 }),
        page: 1,
        limit: 50,
      });

      expect(result.data).toHaveLength(0);
      expect(result.metadata.total).toBe(0);
    });
  });
});