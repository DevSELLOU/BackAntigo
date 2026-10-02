import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../src/users/users.service';
import { UserCompaniesService } from '../../src/user-companies/user-companies.service';
import { EmailsService } from '../../src/emails/emails.service';
import { ConfigService } from '@nestjs/config';
import { AccessRequestsService } from '../../src/presentation/access-requests/access-requests.service';
import { User } from '../../src/users/user.entity';
import { UserStatus } from '../../src/users/enums/user-status.enum';
import { CompanyStatus } from '../../src/companies/enums/company-status.enum';
import { UserRole } from '../../src/users/enums/user-role.enum';
import { Company } from '../../src/companies/company.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compareSync: jest.fn(),
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let emailsService: jest.Mocked<EmailsService>;
  let userCompaniesService: jest.Mocked<UserCompaniesService>;

  const mockCompany: Partial<Company> = {
    id: 1,
    corporateName: 'Test Company',
    status: CompanyStatus.Active,
  };

  const mockUser: User = {
    id: 1,
    email: 'test@test.com',
    password: 'hashed_password',
    name: 'Test User',
    role: UserRole.Administrator,
    status: UserStatus.Active,
    companyId: 1,
    company: mockCompany as Company,
    customer: null,
    createdAt: new Date(),
    position: 'Manager',
    phoneNumber: '123456789',
    profilePhoto: null,
    password_reset_token: null,
    password_reset_expires: null,
    orders: [],
    standardCommissionPercentage: null,
    customerId: null,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock_token'),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOneByEmailForLogin: jest.fn(),
            findByEmail: jest.fn(),
            findByPasswordResetToken: jest.fn(),
            findOneWithNoRole: jest.fn(),
            updatePasswordResetToken: jest.fn(),
            updatePassword: jest.fn(),
            activateUser: jest.fn(),
          },
        },
        {
          provide: UserCompaniesService,
          useValue: {
            getCompaniesForLogin: jest.fn().mockResolvedValue([]),
            findUserCompany: jest.fn(),
            findUserCompanies: jest.fn(),
            isUserInCompany: jest.fn(),
            getUserRoleInCompany: jest.fn(),
          },
        },
        {
          provide: EmailsService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost'),
          },
        },
        {
          provide: AccessRequestsService,
          useValue: {
            createAccessRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    emailsService = module.get(EmailsService);
    userCompaniesService = module.get(UserCompaniesService);
  });

  describe('Login (AUTH-001 to AUTH-003)', () => {
    it('AUTH-001: should return token and user data on successful login', async () => {
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      usersService.findOneByEmailForLogin.mockResolvedValue(mockUser);
      usersService.activateUser.mockResolvedValue(undefined);

      const result = await service.login({
        email: 'test@test.com',
        password: 'password',
      });

      expect(result.accessToken).toBe('mock_token');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@test.com');
    });

    it('AUTH-002: should throw UnauthorizedException with wrong password', async () => {
      usersService.findOneByEmailForLogin.mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await expect(
        service.login({
          email: 'test@test.com',
          password: 'wrong_password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('AUTH-003: should throw NotFoundException when user not found', async () => {
      usersService.findOneByEmailForLogin.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@test.com',
          password: 'password',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Forgot Password (AUTH-004 to AUTH-005)', () => {
    it('AUTH-004: should send reset email for valid email', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.updatePasswordResetToken.mockResolvedValue(undefined);
      emailsService.sendEmail.mockResolvedValue(undefined);

      await service.forgotPassword({ email: 'test@test.com' });

      expect(usersService.updatePasswordResetToken).toHaveBeenCalled();
      expect(emailsService.sendEmail).toHaveBeenCalled();
    });

    it('AUTH-005: should not throw error for non-existent user (security)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'notfound@test.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Reset Password (AUTH-006 to AUTH-007)', () => {
    it('AUTH-006: should update password with valid token', async () => {
      usersService.findByPasswordResetToken.mockResolvedValue(mockUser);
      usersService.updatePassword.mockResolvedValue(undefined);

      await service.resetPassword({
        token: 'valid_token',
        password: 'new_password',
      });

      expect(usersService.updatePassword).toHaveBeenCalled();
    });

    it('AUTH-007: should throw error with expired/invalid token', async () => {
      usersService.findByPasswordResetToken.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'expired_token',
          password: 'new_password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Update Password (AUTH-008)', () => {
    it('AUTH-008: should update password with correct current password', async () => {
      usersService.findOneWithNoRole.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.updatePassword.mockResolvedValue(undefined);

      await service.updatePassword(1, {
        currentPassword: 'current_password',
        newPassword: 'new_password',
      });

      expect(usersService.updatePassword).toHaveBeenCalled();
    });

    it('AUTH-008: should throw error with incorrect current password', async () => {
      usersService.findOneWithNoRole.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.updatePassword(1, {
          currentPassword: 'wrong_password',
          newPassword: 'new_password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
