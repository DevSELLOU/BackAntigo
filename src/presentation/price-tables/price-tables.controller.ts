import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { ExportDataDto, ExportFormat } from 'src/exports/dtos/export-data.dto';
import { ExportsService } from 'src/exports/exports.service';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { CreatePriceTableDto } from './dtos/create-price-table.dto';
import { ImportPriceTableDto } from './dtos/import-price-table.dto';
import { UpdatePriceTableStatusDto } from './dtos/update-price-table-status.dto';
import { UpdatePriceTableDto } from './dtos/update-price-table.dto';
import { PriceTablesService } from './price-tables.service';
import { PricingService } from '../pricing/pricing.service';
import { Multer } from 'multer';
import { logger } from 'src/utils/logger';
import { AuthAdministrator } from 'src/auth/decorators/authenticated-user.decorator';
import type { AuthenticatedUserDto } from 'src/auth/dtos/authenticated-user.dto';

@ApiTags('price-tables')
@Controller('company/:companyId/price-tables')
@ApiBearerAuth()
@Roles(...getRolesAccessibleByRole(UserRole.RegionalManager))
export class PriceTablesController {
  constructor(
    private readonly priceTablesService: PriceTablesService,
    @Inject(ExportsService)
    private readonly exportsService: ExportsService,
    @Inject(PricingService)
    private readonly pricingService: PricingService,
  ) {}

  private getUserId(user: AuthenticatedUserDto | undefined): number {
    return user?.id ?? 0;
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createPriceTable(
    @Param('companyId') companyId: number,
    @Body() createPriceTableDto: CreatePriceTableDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRICE-TABLES] Create request | companyId: ${companyId} | userId: ${userId} | name: ${createPriceTableDto.name}`,
    );

    const createdPriceTable = await this.priceTablesService.createPriceTable(
      companyId,
      createPriceTableDto,
    );

    logger.info(
      `[PRICE-TABLES] Created successfully | priceTableId: ${createdPriceTable.id} | companyId: ${companyId} | userId: ${userId}`,
    );

    return {
      message: 'Tabela de preço criada com sucesso',
      data: createdPriceTable,
    };
  }

  @Get('export')
  async exportPriceTables(
    @Param('companyId') companyId: number,
    @Query() exportDto: ExportDataDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    const format = exportDto.format || ExportFormat.CSV;

    let selectFields = undefined;
    if (exportDto.selectedFields) {
      selectFields = exportDto.selectedFields
        .split(',')
        .map((field) => field.trim());
    }

    const priceTableModel = this.priceTablesService.getModel();

    logger.info(
      `[PRICE-TABLES] Export request | companyId: ${companyId} | userId: ${userId} | format: ${format}`,
    );

    const result = await this.exportsService.exportData(
      priceTableModel,
      exportDto,
      'priceTables',
      'Tabelas de Preço',
      format,
      ['name', 'description'],
      selectFields,
    );

    return {
      message: 'Arquivo de tabelas de preço gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Get('export/selectable-fields')
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('priceTables');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Get(':id')
  async findOne(
    @Param('companyId') companyId: number,
    @Param('id') id: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRICE-TABLES] Find one request | priceTableId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    const foundPriceTable = await this.priceTablesService.findOne(
      companyId,
      id,
    );

    return {
      message: 'Tabela de preço retornada com sucesso',
      data: foundPriceTable,
    };
  }

  @Get()
  async findAll(
    @Param('companyId') companyId: number,
    @Query() query: BaseFindAllDataDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRICE-TABLES] Find all request | companyId: ${companyId} | userId: ${userId} | page: ${
        query.page || 1
      } | limit: ${query.limit || 10}`,
    );

    const { data, metadata } = await this.priceTablesService.findAll(
      companyId,
      query,
    );

    return {
      message: 'Tabelas de preço retornadas com sucesso',
      data,
      metadata,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updatePriceTable(
    @Param('companyId') companyId: number,
    @Param('id') id: number,
    @Body() updatePriceTableDto: UpdatePriceTableDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRICE-TABLES] Update request | priceTableId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    const updatedPriceTable = await this.priceTablesService.updatePriceTable(
      companyId,
      id,
      updatePriceTableDto,
    );

    logger.info(
      `[PRICE-TABLES] Updated successfully | priceTableId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    return {
      message: 'Tabela de preço atualizado com sucesso',
      data: updatedPriceTable,
    };
  }

  @Delete(':id')
  async deletePriceTable(
    @Param('companyId') companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRICE-TABLES] Delete request | priceTableId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    await this.priceTablesService.deletePriceTable(companyId, id);

    logger.info(
      `[PRICE-TABLES] Deleted successfully | priceTableId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    return {
      message: 'Tabela de preço removido com sucesso',
    };
  }

  @Post(':id/status')
  async updatePriceTableStatus(
    @Param('companyId') companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePriceTableStatusDto: UpdatePriceTableStatusDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRICE-TABLES] Update status request | priceTableId: ${id} | companyId: ${companyId} | userId: ${userId} | newStatus: ${updatePriceTableStatusDto.status}`,
    );
    const updatedPriceTable =
      await this.priceTablesService.updatePriceTableStatus(
        companyId,
        id,
        updatePriceTableStatusDto,
      );

    logger.info(
      `[PRICE-TABLES] Status updated successfully | priceTableId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    return {
      message: 'Status da tabela de preço atualizado com sucesso',
      data: updatedPriceTable,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesCoordinator))
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async importPriceTable(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() importPriceTableDto: ImportPriceTableDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'text/csv' })],
        fileIsRequired: false,
      }),
    )
    file?: Multer.File,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRICE-TABLES] Import request | companyId: ${companyId} | userId: ${userId} | name: ${importPriceTableDto.name}`,
    );

    const result = await this.priceTablesService.importPriceTable(
      companyId,
      importPriceTableDto,
      file?.buffer,
    );

    logger.info(
      `[PRICE-TABLES] Import completed successfully | companyId: ${companyId} | userId: ${userId} | processedRows: ${result.processedRows}`,
    );

    return {
      message: 'Tabela de preço importada com sucesso',
      data: result,
    };
  }

  @Get(':id/items')
  async findPriceTableItems(
    @Param('companyId') companyId: number,
    @Param('id') id: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRICE-TABLES] Find items request | priceTableId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    const items = await this.priceTablesService.findPriceTableItems(
      companyId,
      id,
    );

    return {
      message: 'Itens da tabela de preço retornados com sucesso',
      data: items,
    };
  }

  @Patch(':id/items')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updatePriceTableItems(
    @Param('companyId') companyId: number,
    @Param('id') id: number,
    @Body()
    body: { items: { productId: number; manualPrice: number | null }[] },
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    const items = await this.priceTablesService.updatePriceTableItems(
      companyId,
      id,
      body.items,
    );

    logger.info(
      `[PRICE-TABLES] Update items | priceTableId: ${id} | companyId: ${companyId} | userId: ${userId} | itemsCount: ${body.items.length}`,
    );

    return {
      message: 'Itens da tabela de preço atualizados com sucesso',
      data: items,
    };
  }

  @Post(':id/items/import')
  @UseInterceptors(FileInterceptor('file'))
  async importPriceTableItems(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'text/csv' })],
        fileIsRequired: true,
      }),
    )
    file: Multer.File,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRICE-TABLES] Import items request | priceTableId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    const result = await this.priceTablesService.importPriceTableItems(
      companyId,
      id,
      file.buffer,
    );

    logger.info(
      `[PRICE-TABLES] Import items completed | priceTableId: ${id} | companyId: ${companyId} | userId: ${userId} | imported: ${result.imported} | errors: ${result.errors.length}`,
    );

    return {
      message: 'Preços importados com sucesso',
      data: result,
    };
  }
}
