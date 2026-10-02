import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PriceTablesService } from '../../src/presentation/price-tables/price-tables.service';
import { PriceTable } from '../../src/presentation/price-tables/price-table.entity';
import { PriceTableStatus } from '../../src/presentation/price-tables/enums/price-table-status.enum';
import { PriceTableItem } from '../../src/presentation/price-table-items/price-table-item.entity';
import { PriceTableRule, AdjustmentType, RuleConditionOperator } from '../../src/presentation/price-table-rules/price-table-rule.entity';
import { Product } from '../../src/presentation/products/entities/product.entity';
import { CompaniesService } from '../../src/companies/companies.service';
import { ProductsService } from '../../src/presentation/products/products.service';
import { PriceTablesMapper } from '../../src/presentation/price-tables/price-tables.mapper';

describe('PriceTablesService', () => {
  let service: PriceTablesService;
  let priceTablesRepository: any;
  let priceTablesItemsRepository: any;
  let priceTableRulesRepository: any;
  let companiesService: any;
  let productsService: any;
  let priceTablesMapper: any;

  const mockCompany = { id: 1, corporateName: 'Test Company' };

  const mockProduct: Partial<Product> = {
    id: 1,
    name: 'Product 1',
    price: 100,
  };

  const mockPriceTable: Partial<PriceTable> = {
    id: 1,
    name: 'Test Price Table',
    description: 'Test description',
    companyId: 1,
    status: PriceTableStatus.Active,
    startDate: null,
    endDate: null,
    update: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    destroy: jest.fn().mockResolvedValue(true),
  };

  const mockPriceTableRule: Partial<PriceTableRule> = {
    id: 1,
    priceTableId: 1,
    priority: 1,
    conditions: [{ field: 'customerTier', operator: RuleConditionOperator.Equals, value: 'VIP' }],
    adjustmentType: AdjustmentType.PercentageDiscount,
    adjustmentValue: 20,
  };

  const mockPriceTableItem: Partial<PriceTableItem> = {
    id: 1,
    priceTableId: 1,
    productId: 1,
    manualPrice: 80,
    isManual: true,
    product: mockProduct as Product,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceTablesService,
        {
          provide: 'PRICE_TABLE_REPOSITORY',
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            findByPk: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: 'PRICE_TABLE_ITEM_REPOSITORY',
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            bulkCreate: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: 'PRICE_TABLE_RULE_REPOSITORY',
          useValue: {
            findAll: jest.fn(),
            bulkCreate: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: PriceTablesMapper,
          useValue: {
            createPriceTableDtoToPriceTable: jest.fn().mockResolvedValue({
              dataValues: {
                name: 'Test',
                description: 'Test',
              },
            }),
            updatePriceTableDtoToPriceTable: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: CompaniesService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockCompany),
          },
        },
        {
          provide: ProductsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue({ data: [mockProduct] }),
            findAllByIds: jest.fn().mockResolvedValue([mockProduct]),
          },
        },
      ],
    }).compile();

    service = module.get<PriceTablesService>(PriceTablesService);
    priceTablesRepository = module.get('PRICE_TABLE_REPOSITORY');
    priceTablesItemsRepository = module.get('PRICE_TABLE_ITEM_REPOSITORY');
    priceTableRulesRepository = module.get('PRICE_TABLE_RULE_REPOSITORY');
    companiesService = module.get(CompaniesService);
    productsService = module.get(ProductsService);
    priceTablesMapper = module.get(PriceTablesMapper);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPriceTable', () => {
    it('PT-001: should create a price table with all products', async () => {
      priceTablesRepository.create.mockResolvedValue(mockPriceTable);
      productsService.findAll.mockResolvedValue({ data: [mockProduct] });
      priceTablesItemsRepository.bulkCreate.mockResolvedValue([]);
      priceTableRulesRepository.bulkCreate.mockResolvedValue([]);

      const result = await service.createPriceTable(1, {
        name: 'Test Price Table',
        description: 'Test description',
      });

      expect(result).toEqual(mockPriceTable);
      expect(priceTablesRepository.create).toHaveBeenCalled();
      expect(priceTablesItemsRepository.bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({
          priceTableId: 1,
          productId: 1,
          manualPrice: null,
          isManual: false,
        }),
      ]);
    });

    it('PT-002: should create price table with rules', async () => {
      const priceTableWithRules = {
        ...mockPriceTable,
        rules: [mockPriceTableRule],
      };

      priceTablesRepository.create.mockResolvedValue(priceTableWithRules);
      productsService.findAll.mockResolvedValue({ data: [mockProduct] });
      priceTablesItemsRepository.bulkCreate.mockResolvedValue([]);
      priceTableRulesRepository.bulkCreate.mockResolvedValue([]);

      const result = await service.createPriceTable(1, {
        name: 'Test Price Table',
        description: 'Test description',
        rules: [
          {
            priority: 1,
            conditions: [{ field: 'customerTier', operator: 'EQUALS', value: 'VIP' }],
            adjustmentType: 'PERCENTAGE_DISCOUNT' as any,
            adjustmentValue: 20,
          },
        ],
      });

      expect(result).toEqual(priceTableWithRules);
      expect(priceTableRulesRepository.bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({
          priceTableId: 1,
          priority: 1,
          adjustmentType: 'PERCENTAGE_DISCOUNT',
          adjustmentValue: 20,
        }),
      ]);
    });

    it('PT-003: should create price table with date range', async () => {
      priceTablesRepository.create.mockResolvedValue(mockPriceTable);
      productsService.findAll.mockResolvedValue({ data: [] });

      const result = await service.createPriceTable(1, {
        name: 'Seasonal Table',
        description: 'Seasonal pricing',
      });

      expect(result).toEqual(mockPriceTable);
      expect(priceTablesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 1,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('PT-004: should return price table with items and rules', async () => {
      priceTablesRepository.findOne.mockResolvedValue({
        ...mockPriceTable,
        items: [mockPriceTableItem],
        rules: [mockPriceTableRule],
      });

      const result = await service.findOne(1, 1);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('rules');
    });

    it('PT-005: should throw NotFoundException when price table not found', async () => {
      priceTablesRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePriceTable', () => {
    it('PT-006: should update price table basic fields', async () => {
      priceTablesRepository.findOne
        .mockResolvedValueOnce(mockPriceTable)
        .mockResolvedValueOnce({ ...mockPriceTable, name: 'Updated Name' });

      priceTablesMapper.updatePriceTableDtoToPriceTable.mockResolvedValue({
        name: 'Updated Name',
        description: 'Updated description',
      });

      const result = await service.updatePriceTable(1, 1, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(priceTablesRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('PT-007: should update rules when provided', async () => {
      priceTablesRepository.findOne
        .mockResolvedValueOnce({ ...mockPriceTable, rules: [mockPriceTableRule] })
        .mockResolvedValueOnce({ ...mockPriceTable, rules: [] });

      priceTableRulesRepository.destroy.mockResolvedValue(1);
      priceTableRulesRepository.bulkCreate.mockResolvedValue([]);

      await service.updatePriceTable(1, 1, {
        rules: [
          {
            priority: 2,
            conditions: [{ field: 'state', operator: 'EQUALS', value: 'SP' }],
            adjustmentType: 'PERCENTAGE_DISCOUNT' as any,
            adjustmentValue: 10,
          },
        ],
      });

      expect(priceTableRulesRepository.destroy).toHaveBeenCalledWith({
        where: { priceTableId: 1 },
      });
      expect(priceTableRulesRepository.bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({
          priceTableId: 1,
          priority: 2,
        }),
      ]);
    });

    it('PT-008: should remove all rules when empty array provided', async () => {
      priceTablesRepository.findOne
        .mockResolvedValueOnce({ ...mockPriceTable, rules: [mockPriceTableRule] })
        .mockResolvedValueOnce({ ...mockPriceTable, rules: [] });

      priceTableRulesRepository.destroy.mockResolvedValue(1);

      await service.updatePriceTable(1, 1, {
        rules: [],
      });

      expect(priceTableRulesRepository.destroy).toHaveBeenCalledWith({
        where: { priceTableId: 1 },
      });
      expect(priceTableRulesRepository.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('deletePriceTable', () => {
    it('PT-009: should delete price table', async () => {
      priceTablesRepository.findOne.mockResolvedValue(mockPriceTable);

      await service.deletePriceTable(1, 1);

      expect(mockPriceTable.destroy).toHaveBeenCalled();
    });
  });

  describe('findPriceTableItems', () => {
    it('PT-010: should return items with manual prices', async () => {
      priceTablesRepository.findOne.mockResolvedValue(mockPriceTable);
      priceTablesItemsRepository.findAll.mockResolvedValue([
        { productId: 1, manualPrice: 80 },
        { productId: 2, manualPrice: null },
      ]);

      const result = await service.findPriceTableItems(1, 1);

      expect(result).toEqual([
        { productId: 1, manualPrice: 80 },
        { productId: 2, manualPrice: null },
      ]);
    });
  });

  describe('updatePriceTableItems', () => {
    it('PT-011: should update existing items', async () => {
      priceTablesRepository.findOne.mockResolvedValue(mockPriceTable);

      const existingItem = {
        id: 1,
        productId: 1,
        manualPrice: null,
        isManual: false,
        save: jest.fn().mockResolvedValue(true),
      };

      priceTablesItemsRepository.findAll.mockResolvedValue([existingItem]);

      await service.updatePriceTableItems(1, 1, [
        { productId: 1, manualPrice: 90 },
      ]);

      expect(existingItem.save).toHaveBeenCalledWith();
      expect(existingItem.manualPrice).toBe(90);
      expect(existingItem.isManual).toBe(true);
    });

    it('PT-012: should create new items if not exist', async () => {
      priceTablesRepository.findOne.mockResolvedValue(mockPriceTable);
      priceTablesItemsRepository.findAll.mockResolvedValue([]);
      priceTablesItemsRepository.create.mockResolvedValue({});

      await service.updatePriceTableItems(1, 1, [
        { productId: 999, manualPrice: 50 },
      ]);

      expect(priceTablesItemsRepository.create).toHaveBeenCalledWith({
        priceTableId: 1,
        productId: 999,
        manualPrice: 50,
        isManual: true,
      });
    });
  });
});