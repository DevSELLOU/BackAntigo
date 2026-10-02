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
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { ExportDataDto, ExportFormat } from 'src/exports/dtos/export-data.dto';
import { ExportsService } from 'src/exports/exports.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { getRolesAccessibleByRole, UserRole } from './enums/user-role.enum';
import { UsersService } from './users.service';

@ApiTags('user')
@Controller('user')
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(ExportsService)
    private readonly exportsService: ExportsService,
  ) {}

  @Roles(UserRole.Administrator)
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createUser(@Body() createUserDto: CreateUserDto) {
    const createdUser = await this.usersService.createUser(createUserDto);

    return {
      message: 'Usuário criado com sucesso',
      data: createdUser,
    };
  }

  @Roles(UserRole.Administrator)
  @Get('export')
  async exportUsers(@Query() exportDto: ExportDataDto) {
    const format = exportDto.format || ExportFormat.CSV;

    let selectFields = undefined;
    if (exportDto.selectedFields) {
      selectFields = exportDto.selectedFields
        .split(',')
        .map((field) => field.trim());
    }

    const userModel = this.usersService.getModel();

    const result = await this.exportsService.exportData(
      userModel,
      exportDto,
      'users',
      'Usuários',
      format,
      ['name', 'email', 'position', 'phoneNumber'],
      selectFields,
    );

    return {
      message: 'Arquivo de usuários gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Roles(UserRole.Administrator)
  @Get('export/selectable-fields')
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('users');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Roles(UserRole.Administrator)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const foundUser = await this.usersService.findOne(id);

    return {
      message: 'Usuário retornado com sucesso',
      data: foundUser,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.Administrator))
  @Get()
  async findAll(@Query() query: BaseFindAllDataDto) {
    const { data, metadata } = await this.usersService.findAll(query);

    return {
      message: 'Usuários retornados com sucesso',
      data,
      metadata,
    };
  }

  @Roles(UserRole.Administrator)
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.updateUser(id, updateUserDto);

    return {
      message: 'Usuário atualizado com sucesso',
      data: updatedUser,
    };
  }

  @Roles(UserRole.Administrator)
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    const updatedUser = await this.usersService.updateStatus(
      id,
      updateUserStatusDto,
    );

    return {
      message: 'Status do usuário atualizado com sucesso',
      data: updatedUser,
    };
  }

  @Roles(UserRole.Administrator)
  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    await this.usersService.deleteUser(id);

    return {
      message: 'Usuário removido com sucesso',
    };
  }
}
