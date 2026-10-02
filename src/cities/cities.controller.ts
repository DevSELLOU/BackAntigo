import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CompanyOwnershipGuard } from 'src/auth/guards/company-ownership.guard';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { CitiesService } from './cities.service';

@ApiTags('Cities')
@ApiBearerAuth()
@Roles(...getRolesAccessibleByRole(UserRole.SalesRep))
@UseGuards(CompanyOwnershipGuard)
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  async findAll() {
    const data = await this.citiesService.findAll();
    return { message: 'Cidades retornadas com sucesso', data };
  }

  @Post('sync-coordinates')
  async syncCoordinates() {
    const data = await this.citiesService.syncCoordinatesFromIBGE();
    return { message: 'Coordenadas sincronizadas com sucesso', data };
  }
}
