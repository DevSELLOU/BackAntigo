import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from '../../src/presentation/pricing/pricing.service';

enum AdjustmentType {
  PercentageDiscount = 'PERCENTAGE_DISCOUNT',
  PercentageMarkup = 'PERCENTAGE_MARKUP',
  FixedValue = 'FIXED_VALUE',
}

enum PriceTableStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
}

describe('PricingService - Price Table Integration', () => {
  let service: PricingService;
  let priceTablesRepository: any;
  let priceTableItemsRepository: any;
  let priceTableRulesRepository: any;
  let productsRepository: any;

  const mockProduct = {
    id: 1,
    name: 'Product Test',
    price: 100.00,
    minPrice: 0,
  };

  const mockPriceTableActive = {
    id: 1,
    name: 'Active Table - 10% OFF',
    status: PriceTableStatus.Active,
    adjustmentType: AdjustmentType.PercentageDiscount,
    adjustmentValue: 10,
    startDate: null,
    endDate: null,
  };

  const mockPriceTableItemWithManualPrice = {
    id: 1,
    priceTableId: 2,
    productId: 1,
    manualPrice: 75.00,
    isManual: true,
    product: mockProduct,
  };

  const mockPriceTableItemWithoutManualPrice = {
    id: 2,
    priceTableId: 1,
    productId: 1,
    manualPrice: null,
    isManual: false,
    product: mockProduct,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: 'PRICE_TABLE_REPOSITORY',
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: 'PRICE_TABLE_ITEM_REPOSITORY',
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: 'PRICE_TABLE_RULE_REPOSITORY',
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: 'PRODUCT_REPOSITORY',
          useValue: {
            findByPk: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    priceTablesRepository = module.get('PRICE_TABLE_REPOSITORY');
    priceTableItemsRepository = module.get('PRICE_TABLE_ITEM_REPOSITORY');
    priceTableRulesRepository = module.get('PRICE_TABLE_RULE_REPOSITORY');
    productsRepository = module.get('PRODUCT_REPOSITORY');
  });

  describe('Scenario 1: Price Table with Percentage Discount', () => {
    it('PT-PRICING-001: Should apply PERCENTAGE_DISCOUNT when table has adjustmentType and adjustmentValue', async () => {
      priceTablesRepository.findAll.mockResolvedValue([mockPriceTableActive]);
      priceTableRulesRepository.findAll.mockResolvedValue([]);
      priceTableItemsRepository.findOne.mockResolvedValue(null);
      productsRepository.findByPk.mockResolvedValue({ id: 1, price: 100, minPrice: 0 });

      const result = await service.calculateEffectivePrice(1, { customerId: 1, customerTier: 'VIP' }, 1);

      expect(result.priceTableId).toBe(1);
      expect(result.priceTableName).toBe('Active Table - 10% OFF');
      expect(result.basePrice).toBe(100);
      expect(result.finalPrice).toBe(90);
      expect(result.isManual).toBe(false);
    });

    it('PT-PRICING-002: Should apply 20% discount correctly (base: 100, expected: 80)', async () => {
      const tableWith20Discount = { ...mockPriceTableActive, adjustmentValue: 20 };
      priceTablesRepository.findAll.mockResolvedValue([tableWith20Discount]);
      priceTableRulesRepository.findAll.mockResolvedValue([]);
      priceTableItemsRepository.findOne.mockResolvedValue(null);
      productsRepository.findByPk.mockResolvedValue({ id: 1, price: 100, minPrice: 0 });

      const result = await service.calculateEffectivePrice(1, { customerId: 1 }, 1);

      expect(result.finalPrice).toBe(80);
    });
  });

  describe('Scenario 2: Price Table with Percentage Markup', () => {
    it('PT-PRICING-003: Should apply PERCENTAGE_MARKUP (increase)', async () => {
      const tableWithMarkup = {
        ...mockPriceTableActive,
        id: 3,
        name: 'Markup Table',
        adjustmentType: AdjustmentType.PercentageMarkup,
        adjustmentValue: 15,
      };

      priceTablesRepository.findAll.mockResolvedValue([tableWithMarkup]);
      priceTableRulesRepository.findAll.mockResolvedValue([]);
      priceTableItemsRepository.findOne.mockResolvedValue(null);
      productsRepository.findByPk.mockResolvedValue({ id: 1, price: 100, minPrice: 0 });

      const result = await service.calculateEffectivePrice(1, { customerId: 1 }, 1);

      expect(result.finalPrice).toBe(115);
    });
  });

  describe('Scenario 3: Price Table with Fixed Value Adjustment', () => {
    it('PT-PRICING-004: Should apply FIXED_VALUE adjustment (base + value)', async () => {
      const tableWithFixed = {
        ...mockPriceTableActive,
        id: 4,
        name: 'Fixed Value Table',
        adjustmentType: AdjustmentType.FixedValue,
        adjustmentValue: 25,
      };

      priceTablesRepository.findAll.mockResolvedValue([tableWithFixed]);
      priceTableRulesRepository.findAll.mockResolvedValue([]);
      priceTableItemsRepository.findOne.mockResolvedValue(null);
      productsRepository.findByPk.mockResolvedValue({ id: 1, price: 100, minPrice: 0 });

      const result = await service.calculateEffectivePrice(1, { customerId: 1 }, 1);

      expect(result.finalPrice).toBe(125);
    });
  });

  describe('Scenario 4: Manual Price takes precedence over adjustment', () => {
    it('PT-PRICING-005: Should use manual price when set, ignoring adjustment', async () => {
      priceTablesRepository.findAll.mockResolvedValue([mockPriceTableActive]);
      priceTableRulesRepository.findAll.mockResolvedValue([]);
      priceTableItemsRepository.findOne.mockResolvedValue(mockPriceTableItemWithManualPrice);
      productsRepository.findByPk.mockResolvedValue({ id: 1, price: 100, minPrice: 0 });

      const result = await service.calculateEffectivePrice(1, { customerId: 1 }, 1);

      expect(result.isManual).toBe(true);
      expect(result.finalPrice).toBe(75);
      expect(result.finalPrice).not.toBe(90);
    });
  });

  describe('Scenario 5: No matching price table', () => {
    it('PT-PRICING-006: Should return base price when no price table exists', async () => {
      priceTablesRepository.findAll.mockResolvedValue([]);
      productsRepository.findByPk.mockResolvedValue({ id: 1, price: 100, minPrice: 0 });

      const result = await service.calculateEffectivePrice(1, { customerId: 1 }, 1);

      expect(result.priceTableId).toBeNull();
      expect(result.basePrice).toBe(100);
      expect(result.finalPrice).toBe(100);
    });
  });

  describe('Scenario 6: Minimum price protection', () => {
    it('PT-PRICING-007: Should respect minimum price when adjustment goes below it', async () => {
      const tableWithHugeDiscount = {
        ...mockPriceTableActive,
        adjustmentType: AdjustmentType.PercentageDiscount,
        adjustmentValue: 50,
      };

      priceTablesRepository.findAll.mockResolvedValue([tableWithHugeDiscount]);
      priceTableRulesRepository.findAll.mockResolvedValue([]);
      priceTableItemsRepository.findOne.mockResolvedValue(null);
      productsRepository.findByPk.mockResolvedValue({ id: 1, price: 100, minPrice: 60 });

      const result = await service.calculateEffectivePrice(1, { customerId: 1 }, 1);

      expect(result.basePrice).toBe(100);
      expect(result.finalPrice).toBe(60);
      expect(result.isCappedByMinPrice).toBe(false);
    });
  });

  describe('Scenario 7: Active vs Inactive price tables', () => {
    it('PT-PRICING-008: Should NOT apply INACTIVE price table', async () => {
      const inactiveTable = {
        ...mockPriceTableActive,
        id: 5,
        name: 'Inactive Table',
        status: PriceTableStatus.Inactive,
      };

      const activeTable = {
        ...mockPriceTableActive,
        id: 6,
        name: 'Active Table',
        status: PriceTableStatus.Active,
        adjustmentType: AdjustmentType.PercentageDiscount,
        adjustmentValue: 5,
      };

      priceTablesRepository.findAll.mockResolvedValue([inactiveTable, activeTable]);
      priceTableRulesRepository.findAll.mockResolvedValue([]);
      priceTableItemsRepository.findOne.mockResolvedValue(null);
      productsRepository.findByPk.mockResolvedValue({ id: 1, price: 100, minPrice: 0 });

      const result = await service.calculateEffectivePrice(1, { customerId: 1 }, 1);

      expect(result.priceTableName).toBe('Active Table');
      expect(result.finalPrice).toBe(95);
    });
  });
});