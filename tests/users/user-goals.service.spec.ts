import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserGoalsService } from '../../src/user-goals/user-goals.service';
import { CompaniesService } from '../../src/companies/companies.service';
import { UsersService } from '../../src/users/users.service';
import { ProductsService } from '../../src/presentation/products/products.service';
import { UserGoalsMapper } from '../../src/user-goals/user-goals.mapper';
import { UserGoal } from '../../src/user-goals/entities/user-goal.entity';
import { UserGoalProduct } from '../../src/user-goals/entities/user-goal-product.entity';
import { UserGoalType } from '../../src/user-goals/enums/user-goal-type.enum';
import { UserStatus } from '../../src/users/enums/user-status.enum';
import { CompanyStatus } from '../../src/companies/enums/company-status.enum';
import { User } from '../../src/users/user.entity';
import { Company } from '../../src/companies/company.entity';

describe('UserGoalsService', () => {
  let service: UserGoalsService;
  let companiesService: jest.Mocked<CompaniesService>;
  let usersService: jest.Mocked<UsersService>;
  let productsService: jest.Mocked<ProductsService>;
  let userGoalsMapper: jest.Mocked<UserGoalsMapper>;

  const mockCompany: Partial<Company> = {
    id: 1,
    corporateName: 'Test Company',
    status: CompanyStatus.Active,
  };

  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@test.com',
    name: 'Test User',
    role: 'admin' as any,
    status: UserStatus.Active,
    companyId: 1,
    company: mockCompany as Company,
  };

  const mockUserGoal: Partial<UserGoal> = {
    id: 1,
    userId: 1,
    companyId: 1,
    type: UserGoalType.SalesValue,
    targetValue: 10000,
    currentValue: 5000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    user: mockUser as User,
    userGoalProducts: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserGoalsService,
        {
          provide: CompaniesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOneWithNoRole: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: ProductsService,
          useValue: {
            findAllByIds: jest.fn(),
          },
        },
        {
          provide: UserGoalsMapper,
          useValue: {
            createUserGoalDtoToUserGoal: jest.fn().mockResolvedValue({
              dataValues: {
                id: 1,
                userId: 1,
                type: UserGoalType.SalesValue,
                targetValue: 10000,
                currentValue: 0,
                startDate: '2026-01-01',
                endDate: '2026-12-31',
              },
            }),
            updateUserGoalDtoToUserGoal: jest.fn().mockResolvedValue({
              dataValues: {},
            }),
          },
        },
        {
          provide: 'USER_GOAL_REPOSITORY',
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
            findAndCountAll: jest.fn(),
          },
        },
        {
          provide: 'USER_GOAL_PRODUCT_REPOSITORY',
          useValue: {
            bulkCreate: jest.fn(),
            destroy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserGoalsService>(UserGoalsService);
    companiesService = module.get(CompaniesService);
    usersService = module.get(UsersService);
    productsService = module.get(ProductsService);
    userGoalsMapper = module.get(UserGoalsMapper);
  });

  describe('createUserGoal (GOAL-001)', () => {
    it('GOAL-001: should create a user goal with valid data', async () => {
      companiesService.findOne.mockResolvedValue(mockCompany as Company);
      usersService.findOneWithNoRole.mockResolvedValue(mockUser as User);

      const userGoalsRepository = service.getModel();
      (userGoalsRepository.findAll as jest.Mock).mockResolvedValue([]);
      (userGoalsRepository.create as jest.Mock).mockResolvedValue({
        id: 1,
        ...mockUserGoal,
      });
      (userGoalsRepository.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        ...mockUserGoal,
      });

      const result = await service.createUserGoal(1, {
        userId: 1,
        type: UserGoalType.SalesValue,
        targetValue: 10000,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });

      expect(result).toBeDefined();
      expect(userGoalsRepository.create).toHaveBeenCalled();
    });

    it('GOAL-002: should throw BadRequestException on goal overlap', async () => {
      companiesService.findOne.mockResolvedValue(mockCompany as Company);
      usersService.findOneWithNoRole.mockResolvedValue(mockUser as User);

      const userGoalsRepository = service.getModel();
      (userGoalsRepository.findAll as jest.Mock).mockResolvedValue([
        mockUserGoal,
      ]);

      await expect(
        service.createUserGoal(1, {
          userId: 1,
          type: UserGoalType.SalesValue,
          targetValue: 10000,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createProductSalesGoal (GOAL-003)', () => {
    it('GOAL-003: should create product sales goal with products', async () => {
      companiesService.findOne.mockResolvedValue(mockCompany as Company);
      usersService.findOneWithNoRole.mockResolvedValue(mockUser as User);
      productsService.findAllByIds.mockResolvedValue([]);

      const userGoalsRepository = service.getModel();
      (userGoalsRepository.findAll as jest.Mock).mockResolvedValue([]);
      (userGoalsRepository.create as jest.Mock).mockResolvedValue({
        id: 1,
        ...mockUserGoal,
        type: UserGoalType.ProductSales,
      });
      (userGoalsRepository.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        ...mockUserGoal,
        type: UserGoalType.ProductSales,
      });

      const result = await service.createUserGoal(1, {
        userId: 1,
        type: UserGoalType.ProductSales,
        targetValue: 100,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        products: [{ productId: 1, totalToSell: 50 }],
      });

      expect(result).toBeDefined();
    });
  });

  describe('Goal overlap detection', () => {
    it('should detect overlapping goals for same user, type and period', async () => {
      const userGoalsRepository = service.getModel();
      (userGoalsRepository.findAll as jest.Mock).mockResolvedValue([
        mockUserGoal,
      ]);

      await expect(
        service.createUserGoal(1, {
          userId: 1,
          type: UserGoalType.SalesValue,
          targetValue: 10000,
          startDate: '2026-06-01',
          endDate: '2026-12-31',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});


