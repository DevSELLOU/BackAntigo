import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserHierarchiesService, UserNode } from './user-hierarchies.service';
import { AssignManagerDto } from './dtos/assign-manager.dto';
import { User } from '../users/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  UserRole,
  getRolesAccessibleByRole,
} from 'src/users/enums/user-role.enum';

@ApiTags('user-hierarchy')
@Controller('user-hierarchy')
@ApiBearerAuth()
export class UserHierarchiesController {
  constructor(private readonly userHierarchyService: UserHierarchiesService) {}

  @Roles(...getRolesAccessibleByRole(UserRole.CompanyAdministrator))
  @Post('assign-manager')
  async assignManager(@Body() assignManagerDto: AssignManagerDto) {
    try {
      const hierarchy = await this.userHierarchyService.assignManager(
        assignManagerDto.subordinateId,
        assignManagerDto.managerId,
        assignManagerDto.companyId,
      );
      return {
        message: 'Manager assigned successfully.',
        hierarchyId: hierarchy.id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to assign manager.');
    }
  }

  @Get(':userId/manager')
  async getManagerForUser(
    @Param('userId') userId: number,
    @Body('companyId') companyId: number,
  ): Promise<User> {
    const manager = await this.userHierarchyService.getManagerForUser(
      userId,
      companyId,
    );
    if (!manager) {
      throw new NotFoundException(`Manager not found for user ID ${userId}.`);
    }
    return manager;
  }

  @Get(':managerId/subordinates')
  async getSubordinatesForUser(
    @Param('managerId') managerId: number,
    @Body('companyId') companyId: number,
  ): Promise<User[]> {
    const subordinates = await this.userHierarchyService.getSubordinatesForUser(
      managerId,
      companyId,
    );
    return subordinates;
  }

  @Roles(...getRolesAccessibleByRole(UserRole.CompanyAdministrator))
  @Patch(':subordinateId/manager')
  async updateManager(
    @Param('subordinateId') subordinateId: number,
    @Body() assignManagerDto: AssignManagerDto,
  ) {
    if (
      assignManagerDto.subordinateId &&
      assignManagerDto.subordinateId !== subordinateId
    ) {
      throw new BadRequestException(
        'Subordinate ID in URL and body do not match.',
      );
    }

    try {
      const updatedHierarchy = await this.userHierarchyService.updateManager(
        subordinateId,
        assignManagerDto.managerId,
        assignManagerDto.companyId,
      );
      return {
        message: 'Manager updated successfully.',
        hierarchyId: updatedHierarchy.id,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update manager.');
    }
  }

  @Roles(...getRolesAccessibleByRole(UserRole.CompanyAdministrator))
  @Delete(':companyId/:subordinateId/manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeManager(
    @Param('subordinateId') subordinateId: number,
    @Param('companyId') companyId: number,
  ) {
    try {
      await this.userHierarchyService.removeManager(subordinateId, companyId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to remove manager relationship.');
    }
  }

  @Roles(...getRolesAccessibleByRole(UserRole.CompanyAdministrator))
  @Get('company/:companyId/tree')
  async getCompanyHierarchyTree(
    @Param('companyId') companyId: number,
  ): Promise<UserNode[]> {
    try {
      const hierarchyTree =
        await this.userHierarchyService.getCompanyHierarchyTree(companyId);
      return hierarchyTree;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve company hierarchy.');
    }
  }
}
