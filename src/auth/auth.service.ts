import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { CompanyStatus } from 'src/companies/enums/company-status.enum';
import { AccessRequest } from 'src/presentation/access-requests/access-request.entity';
import { AccessRequestsService } from 'src/presentation/access-requests/access-requests.service';
import { UserCompaniesService } from 'src/user-companies/user-companies.service';
import { EmailsService } from '../emails/emails.service';
import { UserStatus } from '../users/enums/user-status.enum';
import { UsersService } from '../users/users.service';
import { AuthAccessRequestDto } from './dtos/auth-access-request.dto';
import { AuthLoginDto } from './dtos/auth-login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { SwitchCompanyDto } from './dtos/switch-company.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { UserLoginResponseDto } from './dtos/user-login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(UserCompaniesService)
    private readonly userCompaniesService: UserCompaniesService,
    @Inject(EmailsService)
    private readonly emailsService: EmailsService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(AccessRequestsService)
    private readonly accessRequestsService: AccessRequestsService,
  ) {}

  async login(credentials: AuthLoginDto) {
    const user = await this.usersService.findOneByEmailForLogin(
      credentials.email,
    );

    if (!user) {
      throw new NotFoundException(`Usuário não encontrado`);
    }

    if (user.status === UserStatus.Inactive)
      throw new UnauthorizedException('Usuário inativo');

    if (!user || !bcrypt.compareSync(credentials.password, user.password))
      throw new UnauthorizedException('Email ou senha inválidos!');

    if (user.status === UserStatus.Onboarding) {
      await this.usersService.activateUser(user.id);
    }

    const userCompanies = await this.userCompaniesService.getCompaniesForLogin(
      user.id,
    );

    const hasCompanies = userCompanies.length > 0;

    if (!hasCompanies && user.role !== 'ADMINISTRATOR') {
      throw new UnauthorizedException('Usuário não pertence a nenhuma empresa');
    }

    let activeCompanyId = credentials.companyId;

    if (activeCompanyId) {
      const isValid = userCompanies.some(
        (uc) => uc.companyId === activeCompanyId,
      );
      if (!isValid) {
        throw new UnauthorizedException('Usuário não pertence a esta empresa');
      }
    } else if (hasCompanies) {
      activeCompanyId = userCompanies[0].companyId;
    }

    const activeUserCompany = activeCompanyId
      ? userCompanies.find((uc) => uc.companyId === activeCompanyId)
      : null;

    const roleInCompany = activeUserCompany?.role || user.role;

    const acessToken = await this.jwtService.signAsync({
      id: user.id,
      email: user.email,
      role: roleInCompany,
      companyId: activeCompanyId,
      activeCompanyId,
    });

    const companies = userCompanies.map((uc) => ({
      userCompanyId: uc.id,
      companyId: uc.companyId,
      companyName: uc.company?.corporateName,
      fantasyName: uc.company?.fantasyName,
      role: uc.role,
      logoUrl: uc.company?.logoUrl,
    }));

    const userResponse: UserLoginResponseDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleInCompany,
      status: user.status,
      createdAt: user.createdAt,
      companyId: activeCompanyId,
      activeCompanyId,
      companies,
      position: user.position,
      phoneNumber: user.phoneNumber,
      profilePhoto: user.profilePhoto,
    };

    return {
      accessToken: acessToken,
      user: userResponse,
    };
  }

  async switchCompany(userId: number, switchCompanyDto: SwitchCompanyDto) {
    const userCompany = await this.userCompaniesService.findUserCompany(
      userId,
      switchCompanyDto.companyId,
    );

    if (!userCompany) {
      throw new UnauthorizedException('Usuário não pertence a esta empresa');
    }

    if (userCompany.status !== 'ACTIVE') {
      throw new UnauthorizedException('Vínculo com esta empresa está inativo');
    }

    const accessToken = await this.jwtService.signAsync({
      id: userId,
      email: userCompany.user.email,
      role: userCompany.role,
      companyId: switchCompanyDto.companyId,
      activeCompanyId: switchCompanyDto.companyId,
    });

    return {
      accessToken,
      activeCompanyId: switchCompanyDto.companyId,
      role: userCompany.role,
    };
  }

  async getMyCompanies(userId: number) {
    return this.userCompaniesService.getCompaniesForLogin(userId);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const passwordResetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.usersService.updatePasswordResetToken(
      user.id,
      passwordResetToken,
      expiresAt,
    );

    const resetLink = `${this.configService.get(
      'FRONTEND_URL',
    )}/reset-password/${passwordResetToken}`;

    await this.emailsService.sendEmail(
      user.email,
      'Recuperação de Senha - SELLOU',
      'forgot-password',
      {
        fullName: user.name,
        year: new Date().getFullYear(),
        token: passwordResetToken,
        resetLink,
      },
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const user = await this.usersService.findByPasswordResetToken(
      resetPasswordDto.token,
    );

    if (!user)
      throw new UnauthorizedException('Token de recuperação de senha inválido');

    const passwordHash = await bcrypt.hash(resetPasswordDto.password, 10);

    await this.usersService.updatePassword(user.id, passwordHash);
  }

  async updatePassword(
    id: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const user = await this.usersService.findOneWithNoRole(id);

    const passwordsMatch = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.password,
    );

    if (!passwordsMatch)
      throw new UnauthorizedException('Senha atual inválida');

    const passwordHash = await bcrypt.hash(updatePasswordDto.newPassword, 10);

    await this.usersService.updatePassword(user.id, passwordHash);
  }

  async accessRequest(
    companyId: number,
    accessRequestDto: AuthAccessRequestDto,
  ): Promise<AccessRequest> {
    return await this.accessRequestsService.createAccessRequest(
      companyId,
      accessRequestDto,
    );
  }
}
