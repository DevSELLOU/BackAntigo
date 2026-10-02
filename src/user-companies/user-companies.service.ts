import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AddUserToCompanyDto } from './dtos/add-user-to-company.dto';
import { UpdateUserCompanyDto } from './dtos/update-user-company.dto';
import { UserCompanyStatus } from './enums/user-company-status.enum';
import { UserCompany } from './user-company.entity';

@Injectable()
export class UserCompaniesService {
  constructor(
    @Inject('USER_COMPANY_REPOSITORY')
    private userCompanyRepository: typeof UserCompany,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  async addUserToCompany(
    companyId: number,
    dto: AddUserToCompanyDto,
  ): Promise<UserCompany> {
    let user = await this.usersService.findByEmailOptional(dto.email);

    if (!user) {
      user = await this.usersService.createUser({
        name: dto.email.split('@')[0],
        email: dto.email,
        position: dto.position || 'Vendedor',
        phoneNumber: '',
      });
    }

    const existing = await this.userCompanyRepository.findOne({
      where: { userId: user.id, companyId },
    });

    if (existing) {
      throw new ConflictException('Usuário já pertence a esta empresa');
    }

    const userCompany = await this.userCompanyRepository.create({
      userId: user.id,
      companyId,
      role: dto.role,
      status: UserCompanyStatus.ACTIVE,
      position: dto.position,
    } as any);

    return userCompany;
  }

  async findCompanyUsers(companyId: number): Promise<UserCompany[]> {
    return this.userCompanyRepository.findAll({
      where: { companyId, status: UserCompanyStatus.ACTIVE },
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'profilePhoto'] },
      ],
    });
  }

  async findUserCompanies(userId: number): Promise<UserCompany[]> {
    return this.userCompanyRepository.findAll({
      where: { userId, status: UserCompanyStatus.ACTIVE },
      include: [
        {
          model: Company,
          attributes: ['id', 'corporateName', 'fantasyName', 'logoUrl'],
        },
      ],
    });
  }

  async findUserCompany(
    userId: number,
    companyId: number,
  ): Promise<UserCompany> {
    const userCompany = await this.userCompanyRepository.findOne({
      where: { userId, companyId },
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Company, attributes: ['id', 'corporateName', 'fantasyName'] },
      ],
    });

    if (!userCompany) {
      throw new NotFoundException('Usuário não encontrado nesta empresa');
    }

    return userCompany;
  }

  async updateUserCompany(
    companyId: number,
    userId: number,
    dto: UpdateUserCompanyDto,
  ): Promise<UserCompany> {
    const userCompany = await this.findUserCompany(userId, companyId);

    await userCompany.update(dto);
    return userCompany;
  }

  async removeUserFromCompany(
    companyId: number,
    userId: number,
  ): Promise<void> {
    const userCompany = await this.userCompanyRepository.findOne({
      where: { userId, companyId },
    });

    if (!userCompany) {
      throw new NotFoundException('Usuário não encontrado nesta empresa');
    }

    await userCompany.destroy();
  }

  async isUserInCompany(userId: number, companyId: number): Promise<boolean> {
    const userCompany = await this.userCompanyRepository.findOne({
      where: { userId, companyId, status: UserCompanyStatus.ACTIVE },
    });

    return !!userCompany;
  }

  async getUserRoleInCompany(
    userId: number,
    companyId: number,
  ): Promise<string | null> {
    const userCompany = await this.userCompanyRepository.findOne({
      where: { userId, companyId, status: UserCompanyStatus.ACTIVE },
    });

    return userCompany?.role || null;
  }

  async getCompaniesForLogin(userId: number) {
    return this.userCompanyRepository.findAll({
      where: { userId, status: UserCompanyStatus.ACTIVE },
      include: [
        {
          model: Company,
          attributes: ['id', 'corporateName', 'fantasyName', 'logoUrl'],
        },
      ],
    });
  }
}
