import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthAdministrator } from './decorators/authenticated-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthAccessRequestDto } from './dtos/auth-access-request.dto';
import { AuthLoginDto } from './dtos/auth-login.dto';
import { AuthenticatedUserDto } from './dtos/authenticated-user.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { SwitchCompanyDto } from './dtos/switch-company.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';

@ApiTags('auth')
@Controller('auth')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() authLoginDto: AuthLoginDto) {
    const data = await this.authService.login(authLoginDto);

    return {
      message: 'Usuário autenticado com sucesso',
      data,
    };
  }

  @Post('switch-company')
  async switchCompany(
    @AuthAdministrator() authenticatedUserDto: AuthenticatedUserDto,
    @Body() switchCompanyDto: SwitchCompanyDto,
  ) {
    const data = await this.authService.switchCompany(
      authenticatedUserDto.id,
      switchCompanyDto,
    );

    return {
      message: 'Empresa alterada com sucesso',
      data,
    };
  }

  @Get('my-companies')
  async myCompanies(
    @AuthAdministrator() authenticatedUserDto: AuthenticatedUserDto,
  ) {
    const data = await this.authService.getMyCompanies(authenticatedUserDto.id);

    return {
      message: 'Empresas retornadas com sucesso',
      data,
    };
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    @Body()
    forgotPasswordDto: ForgotPasswordDto,
  ) {
    await this.authService.forgotPassword(forgotPasswordDto);

    return {
      message: 'E-mail de recuperação de senha enviado com sucesso',
    };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body()
    resetPasswordDto: ResetPasswordDto,
  ) {
    await this.authService.resetPassword(resetPasswordDto);

    return {
      message: 'Senha redefinida com sucesso',
    };
  }

  @Get('profile')
  async getProfile(
    @AuthAdministrator() authenticatedUserDto: AuthenticatedUserDto,
  ) {
    return {
      message: 'Perfil retornado com sucesso',
      user: authenticatedUserDto,
    };
  }

  @Patch('password')
  async updatePassword(
    @AuthAdministrator() authenticatedUserDto: AuthenticatedUserDto,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.authService.updatePassword(
      authenticatedUserDto.id,
      updatePasswordDto,
    );

    return {
      message: 'Senha atualizada com sucesso',
    };
  }

  @Public()
  @Post('company/:companyId/access-request')
  async accessRequest(
    @Param('companyId') companyId: number,
    @Body() accessRequestDto: AuthAccessRequestDto,
  ) {
    const data = await this.authService.accessRequest(
      companyId,
      accessRequestDto,
    );

    return {
      message: 'Solicitação de acesso enviada com sucesso',
      data,
    };
  }
}
