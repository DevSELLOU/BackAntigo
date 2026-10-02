import {
  Body,
  Controller,
  Delete,
  Get,
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
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { CreateUserGoalDto } from './dtos/create-user-goal.dto';
import { FindAllUserGoalsDto } from './dtos/find-all-user-goals.dto';
import { GetGoalsDashboardDto } from './dtos/get-goals-dashboard.dto';
import { UpdateUserGoalDto } from './dtos/update-user-goal.dto';
import { UserGoalsService } from './user-goals.service';
import { logger } from 'src/utils/logger';

@ApiTags('user-goals')
@Controller('company/:companyId/user-goals')
@ApiBearerAuth()
export class UserGoalsController {
  constructor(private readonly userGoalsService: UserGoalsService) {}

  @Roles(...getRolesAccessibleByRole(UserRole.CompanyAdministrator))
  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async createUserGoal(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() createUserGoalDto: CreateUserGoalDto,
  ) {
    logger.info(
      `[USER-GOALS] Create request | companyId: ${companyId} | userId: ${createUserGoalDto.userId} | type: ${createUserGoalDto.type}`,
    );

    const createdUserGoal = await this.userGoalsService.createUserGoal(
      companyId,
      createUserGoalDto,
    );

    logger.info(
      `[USER-GOALS] Created successfully | goalId: ${createdUserGoal.id} | companyId: ${companyId}`,
    );

    return {
      message: 'Meta criada com sucesso',
      data: createdUserGoal,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.CompanyAdministrator))
  @Get(':id')
  async findOne(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    logger.info(
      `[USER-GOALS] Find one request | goalId: ${id} | companyId: ${companyId}`,
    );

    const userGoal = await this.userGoalsService.findOne(companyId, id);

    return {
      message: 'Meta retornada com sucesso',
      data: userGoal,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.CompanyAdministrator))
  @Get()
  async findAll(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query() query: FindAllUserGoalsDto,
  ) {
    logger.info(
      `[USER-GOALS] Find all request | companyId: ${companyId} | page: ${
        query.page || 1
      } | limit: ${query.limit || 10}`,
    );

    const { data, metadata } = await this.userGoalsService.findAll(
      companyId,
      query,
    );

    return {
      message: 'Metas retornadas com sucesso',
      data,
      metadata,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.CompanyAdministrator))
  @Patch(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async updateUserGoal(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserGoalDto: UpdateUserGoalDto,
  ) {
    logger.info(
      `[USER-GOALS] Update request | goalId: ${id} | companyId: ${companyId}`,
    );

    const updatedUserGoal = await this.userGoalsService.updateUserGoal(
      companyId,
      id,
      updateUserGoalDto,
    );

    logger.info(
      `[USER-GOALS] Updated successfully | goalId: ${id} | companyId: ${companyId}`,
    );

    return {
      message: 'Meta atualizada com sucesso',
      data: updatedUserGoal,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.CompanyAdministrator))
  @Delete(':id')
  async deleteUserGoal(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    logger.info(
      `[USER-GOALS] Delete request | goalId: ${id} | companyId: ${companyId}`,
    );

    await this.userGoalsService.deleteUserGoal(companyId, id);

    logger.info(
      `[USER-GOALS] Deleted successfully | goalId: ${id} | companyId: ${companyId}`,
    );

    return {
      message: 'Meta removida com sucesso',
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.CompanyAdministrator))
  @Get('user/:userId')
  async getUserGoals(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    logger.info(
      `[USER-GOALS] Get user goals request | userId: ${userId} | companyId: ${companyId}`,
    );

    const userGoals = await this.userGoalsService.getUserGoalsByUser(
      companyId,
      userId,
    );

    return {
      message: 'Metas do usuário retornadas com sucesso',
      data: userGoals,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
  @Get('dashboard/summary')
  async getDashboardSummary(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query() query: GetGoalsDashboardDto,
  ) {
    const summary = await this.userGoalsService.getDashboardSummary(
      companyId,
      query.year,
      query.userId,
      query.month,
    );

    return {
      message: 'Resumo do dashboard retornado com sucesso',
      data: summary,
    };
  }
}
