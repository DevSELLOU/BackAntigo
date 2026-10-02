import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { ExportDataDto, ExportFormat } from 'src/exports/dtos/export-data.dto';
import { ExportsService } from 'src/exports/exports.service';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { UpdateUserDto } from 'src/users/dtos/update-user.dto';
import { UsersService } from 'src/users/users.service';
import { UserCompaniesService } from 'src/user-companies/user-companies.service';
import { AddUserToCompanyDto } from 'src/user-companies/dtos/add-user-to-company.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  getRolesAccessibleByRole,
  UserRole,
} from '../users/enums/user-role.enum';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyPreferencesDto } from './dtos/update-company-preferences.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';

@ApiTags('company')
@Controller('company')
@ApiBearerAuth()
export class CompaniesController {
  constructor(
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject(UserCompaniesService)
    private readonly userCompaniesService: UserCompaniesService,
    @Inject(ExportsService)
    private readonly exportsService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    const createdCompany = await this.companiesService.createCompany(
      createCompanyDto,
    );

    return {
      message: 'Empresa criada com sucesso',
      data: createdCompany,
    };
  }

  @Get('export')
  @Roles(UserRole.Administrator)
  async exportCompanies(@Query() exportDto: ExportDataDto) {
    const format = exportDto.format || ExportFormat.CSV;

    let selectFields = undefined;
    if (exportDto.selectedFields) {
      selectFields = exportDto.selectedFields
        .split(',')
        .map((field) => field.trim());
    }

    const companyModel = this.companiesService.getModel();

    const result = await this.exportsService.exportData(
      companyModel,
      exportDto,
      'companies',
      'Empresas',
      format,
      ['corporateName', 'fantasyName', 'cnpj'],
      selectFields,
    );

    return {
      message: 'Arquivo de empresas gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Get('export/selectable-fields')
  @Roles(UserRole.Administrator)
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('companies');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Get(':id')
  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const foundCompany = await this.companiesService.findOne(id);

    return {
      message: 'Empresa retornada com sucesso',
      data: foundCompany,
    };
  }

  @Get()
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  async findAll(@Query() query: BaseFindAllDataDto) {
    const { data, metadata } = await this.companiesService.findAll(query);

    return {
      message: 'Empresas retornadas com sucesso',
      data,
      metadata,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  async updateCompany(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    const updatedCompany = await this.companiesService.updateCompany(
      id,
      updateCompanyDto,
    );

    return {
      message: 'Empresa atualizada com sucesso',
      data: updatedCompany,
    };
  }

  @Delete(':id')
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  async deleteCompany(@Param('id', ParseIntPipe) id: number) {
    await this.companiesService.deleteCompany(id);

    return {
      message: 'Empresa removida com sucesso',
    };
  }

  @Post(':id/users')
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createCompanyUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddUserToCompanyDto,
  ) {
    await this.companiesService.findOne(id);
    const data = await this.userCompaniesService.addUserToCompany(id, dto);

    return {
      message: 'Usuário da Empresa criado com sucesso',
      data,
    };
  }

  @Get(':id/users')
  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  async findCompanyUsers(@Param('id', ParseIntPipe) id: number) {
    await this.companiesService.findOne(id);
    const data = await this.userCompaniesService.findCompanyUsers(id);

    return {
      message: 'Usuários da Empresa retornados com sucesso',
      data,
    };
  }

  @Get(':id/users/:userId')
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  async findCompanyUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    await this.companiesService.findOne(id);
    const data = await this.userCompaniesService.findUserCompany(userId, id);

    return {
      message: 'Usuário da Empresa retornado com sucesso',
      data,
    };
  }

  @Public()
  @Get(':id/public')
  async findCompanyPublic(@Param('id', ParseIntPipe) id: number) {
    const data = await this.companiesService.findCompanyPublic(id);

    return {
      message: 'Empresa retornada com sucesso',
      data,
    };
  }

  @Public()
  @Get('by-fantasy-name/:fantasyName/public')
  async findCompanyPublicByFantasyName(
    @Param('fantasyName') fantasyName: string,
  ) {
    const decodedFantasyName = decodeURIComponent(fantasyName);
    const data = await this.companiesService.findCompanyPublicByFantasyName(
      decodedFantasyName,
    );

    return {
      message: 'Empresa retornada com sucesso',
      data,
    };
  }

  @Patch(':id/users/:userId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  async updateCompanyUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    await this.companiesService.findOne(id);
    const updatedUser = await this.usersService.updateUser(
      userId,
      updateUserDto,
    );

    return {
      message: 'Usuário da Empresa atualizado com sucesso',
      data: updatedUser,
    };
  }

  @Delete(':id/users/:userId')
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  async deleteCompanyUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    await this.companiesService.findOne(id);
    await this.userCompaniesService.removeUserFromCompany(id, userId);

    return {
      message: 'Usuário da Empresa removido com sucesso',
    };
  }

  @Patch(':id/settings/preferences')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Roles(UserRole.Administrator, UserRole.CompanyAdministrator)
  async updateCompanyPreferences(
    @Param('id', ParseIntPipe) id: number,
    @Body() preferences: UpdateCompanyPreferencesDto,
  ) {
    await this.companiesService.findOne(id);
    const updatedCompany = await this.companiesService.updateCompanyPreferences(
      id,
      preferences,
    );

    return {
      message: 'Preferências da Empresa atualizadas com sucesso',
      data: updatedCompany,
    };
  }
}
