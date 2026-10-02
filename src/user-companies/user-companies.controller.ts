import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { AddUserToCompanyDto } from './dtos/add-user-to-company.dto';
import { UpdateUserCompanyDto } from './dtos/update-user-company.dto';
import { UserCompaniesService } from './user-companies.service';

@ApiTags('user-companies')
@Controller('user-companies')
@ApiBearerAuth()
export class UserCompaniesController {
  constructor(private readonly userCompaniesService: UserCompaniesService) {}

  @Post('company/:companyId')
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addUserToCompany(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() dto: AddUserToCompanyDto,
  ) {
    const data = await this.userCompaniesService.addUserToCompany(
      companyId,
      dto,
    );

    return {
      message: 'Usuário adicionado à empresa com sucesso',
      data,
    };
  }

  @Get('company/:companyId')
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  async findCompanyUsers(@Param('companyId', ParseIntPipe) companyId: number) {
    const data = await this.userCompaniesService.findCompanyUsers(companyId);

    return {
      message: 'Usuários da empresa retornados com sucesso',
      data,
    };
  }

  @Get('user/:userId')
  @Roles(UserRole.Administrator)
  async findUserCompanies(@Param('userId', ParseIntPipe) userId: number) {
    const data = await this.userCompaniesService.findUserCompanies(userId);

    return {
      message: 'Empresas do usuário retornadas com sucesso',
      data,
    };
  }

  @Patch('company/:companyId/user/:userId')
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateUserCompany(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserCompanyDto,
  ) {
    const data = await this.userCompaniesService.updateUserCompany(
      companyId,
      userId,
      dto,
    );

    return {
      message: 'Vínculo usuário-empresa atualizado com sucesso',
      data,
    };
  }

  @Delete('company/:companyId/user/:userId')
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  async removeUserFromCompany(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    await this.userCompaniesService.removeUserFromCompany(companyId, userId);

    return {
      message: 'Usuário removido da empresa com sucesso',
    };
  }
}
