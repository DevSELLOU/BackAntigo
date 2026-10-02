import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateOrderDto, CreateOrderItemDto } from '../../src/presentation/orders/dtos/create-order.dto';

describe('CreateOrderDto Validation', () => {
  describe('Responsible sellers validation (ORD-010 to ORD-013)', () => {
    const baseDto = {
      customerId: 1,
      paymentMethodId: 1,
      paymentConditionId: 1,
      discount: 0,
      isBudget: false,
      items: [{ productId: 1, quantity: 2 }],
    };

    it('ORD-010: should pass without responsibleUserIds (optional)', async () => {
      const dto = plainToInstance(CreateOrderDto, baseDto);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('ORD-011: should pass with valid responsibleUserIds array', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        ...baseDto,
        responsibleUserIds: [1, 2, 3],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('ORD-012: should fail when responsibleUserIds contains non-number values', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        ...baseDto,
        responsibleUserIds: [1, 'a' as any],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('responsibleUserIds');
    });

    it('ORD-013: should fail when responsibleUserIds is not an array', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        ...baseDto,
        responsibleUserIds: 1 as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('responsibleUserIds');
    });
  });

  describe('Order-level discount validation (ORD-001 to ORD-006)', () => {
    it('ORD-001: should pass with discount: 0', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        customerId: 1,
        paymentMethodId: 1,
        paymentConditionId: 1,
        discount: 0,
        isBudget: false,
        items: [{ productId: 1, quantity: 2 }],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('ORD-002: should pass with decimal discount (10.50)', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        customerId: 1,
        paymentMethodId: 1,
        paymentConditionId: 1,
        discount: 10.5,
        isBudget: false,
        items: [{ productId: 1, quantity: 2 }],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('ORD-003: should fail with string discount (not valid number type)', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        customerId: 1,
        paymentMethodId: 1,
        paymentConditionId: 1,
        discount: '0' as any,
        isBudget: false,
        items: [{ productId: 1, quantity: 2 }],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('discount');
    });

    it('ORD-004: should pass without discount (optional field)', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        customerId: 1,
        paymentMethodId: 1,
        paymentConditionId: 1,
        isBudget: false,
        items: [{ productId: 1, quantity: 2 }],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('ORD-005: should fail with invalid discount string', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        customerId: 1,
        paymentMethodId: 1,
        paymentConditionId: 1,
        discount: 'abc' as any,
        isBudget: false,
        items: [{ productId: 1, quantity: 2 }],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('discount');
    });

    it('ORD-006: should fail with too many decimal places', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        customerId: 1,
        paymentMethodId: 1,
        paymentConditionId: 1,
        discount: 10.123,
        isBudget: false,
        items: [{ productId: 1, quantity: 2 }],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('discount');
    });
  });
});

describe('CreateOrderItemDto Validation', () => {
  describe('Item discount validation (ORD-007 to ORD-009)', () => {
    it('ORD-007: should pass item with valid discount', async () => {
      const dto = plainToInstance(CreateOrderItemDto, {
        productId: 1,
        quantity: 2,
        discount: 5.0,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('ORD-008: should pass item without discount', async () => {
      const dto = plainToInstance(CreateOrderItemDto, {
        productId: 1,
        quantity: 2,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('ORD-009: should fail item with invalid discount', async () => {
      const dto = plainToInstance(CreateOrderItemDto, {
        productId: 1,
        quantity: 2,
        discount: 'x' as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('discount');
    });
  });
});
