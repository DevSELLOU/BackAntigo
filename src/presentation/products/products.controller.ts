import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  FileTypeValidator,
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
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ExportDataDto, ExportFormat } from 'src/exports/dtos/export-data.dto';
import { ExportsService } from 'src/exports/exports.service';
import {
  getRolesAccessibleByRole,
  UserRole,
} from 'src/users/enums/user-role.enum';
import { addCompanyIdToFilters } from 'src/utils/filter-utils';
import { CreateStockMovementDto } from '../stock-movement/dtos/create-stock-movement.dto';
import { StockMovementService } from '../stock-movement/stock-movement.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { FindAllProductsDto } from './dtos/find-all-products.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { UpdatePriceOverrideDto } from './dtos/update-price-override.dto';
import { ProductsService } from './products.service';
import { PricingService } from '../pricing/pricing.service';
import { Multer } from 'multer';
import { logger } from 'src/utils/logger';
import { ProductsMapper } from './products.mapper';
import { AuthAdministrator } from 'src/auth/decorators/authenticated-user.decorator';
import type { AuthenticatedUserDto } from 'src/auth/dtos/authenticated-user.dto';

@ApiTags('products')
@Controller('company/:companyId/products')
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productsMapper: ProductsMapper,
    @Inject(StockMovementService)
    private readonly stockMovementService: StockMovementService,
    @Inject(ExportsService)
    private readonly exportsService: ExportsService,
    @Inject(PricingService)
    private readonly pricingService: PricingService,
  ) {}

  private getUserId(user: AuthenticatedUserDto | undefined): number {
    return user?.id ?? 0;
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesCoordinator))
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createProduct(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() createProductDto: CreateProductDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRODUCTS] Create request | companyId: ${companyId} | userId: ${userId} | name: ${createProductDto.name}`,
    );

    const createdProduct = await this.productsService.createProduct(
      companyId,
      createProductDto,
    );

    logger.info(
      `[PRODUCTS] Created successfully | productId: ${createdProduct.id} | companyId: ${companyId} | userId: ${userId}`,
    );

    return {
      message: 'Produto criado com sucesso',
      data: createdProduct,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesCoordinator))
  @Get('export')
  async exportProducts(
    @Param('companyId', ParseIntPipe) companyId: number,
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

    const filteredExportDto = addCompanyIdToFilters(exportDto, companyId);

    const productModel = this.productsService.getModel();

    logger.info(
      `[PRODUCTS] Export request | companyId: ${companyId} | userId: ${userId} | format: ${format}`,
    );

    const result = await this.exportsService.exportData(
      productModel,
      filteredExportDto,
      'products',
      'Produtos',
      format,
      ['name', 'description', 'price', 'stock', 'brand', 'reference'],
      selectFields,
    );

    return {
      message: 'Arquivo de produtos gerado com sucesso',
      data: {
        fileUrl: result.fileUrl,
        filename: result.filename,
      },
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesCoordinator))
  @Get('export/selectable-fields')
  async getSelectableFields() {
    const fields = this.exportsService.getSelectableFields('products');

    return {
      message: 'Campos selecionáveis retornados com sucesso',
      data: fields,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesCoordinator))
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(
    @Param('companyId', ParseIntPipe) companyId: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
    @Body('mode', new ParseEnumPipe(['create', 'update']))
    mode: 'create' | 'update',
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'text/csv' })],
        fileIsRequired: true,
      }),
    )
    file: Multer.File,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRODUCTS] Import request | companyId: ${companyId} | userId: ${userId} | mode: ${mode}`,
    );

    const result = await this.productsService.importProductsFromCSV(
      companyId,
      file.buffer,
      mode,
    );

    logger.info(
      `[PRODUCTS] Import completed | companyId: ${companyId} | userId: ${userId} | imported: ${result.count}`,
    );

    return {
      message: `${result.count} produtos foram importados com sucesso.`,
      data: result,
    };
  }

  @Public()
  @Get(':id')
  async findOne(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRODUCTS] Find one request | productId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    const product = await this.productsService.findOne(companyId, id);

    const formatted = await this.productsMapper.productToResponse(product);

    return {
      message: 'Produto retornado com sucesso',
      data: formatted,
    };
  }

  @Public()
  @Get()
  async findAll(
    @Param('companyId') companyId: number,
    @Query() query: FindAllProductsDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRODUCTS] Find all request | companyId: ${companyId} | userId: ${userId} | page: ${
        query.page || 1
      } | limit: ${query.limit || 10}`,
    );

    const { data, metadata } = await this.productsService.findAll(
      companyId,
      query,
    );

    const formattedData = await Promise.all(
      data.map((p) => this.productsMapper.productToResponse(p)),
    );

    return {
      message: 'Produtos retornados com sucesso',
      data: formattedData,
      metadata,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesCoordinator))
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateProduct(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRODUCTS] Update request | productId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    const updatedProduct = await this.productsService.updateProduct(
      companyId,
      id,
      updateProductDto,
    );

    logger.info(
      `[PRODUCTS] Updated successfully | productId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    return {
      message: 'Produto atualizado com sucesso',
      data: updatedProduct,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesCoordinator))
  @Delete(':id')
  async deleteProduct(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRODUCTS] Delete request | productId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    await this.productsService.deleteProduct(companyId, id);

    logger.info(
      `[PRODUCTS] Deleted successfully | productId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    return {
      message: 'Produto removido com sucesso',
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesCoordinator))
  @Post('/stock-movement')
  async createStockMovement(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() createStockMovementDto: CreateStockMovementDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRODUCTS] Create stock movement | companyId: ${companyId} | userId: ${userId} | productId: ${createStockMovementDto.productId} | type: ${createStockMovementDto.type}`,
    );

    const createdStockMovement = await this.productsService.createStockMovement(
      companyId,
      createStockMovementDto,
    );

    return {
      message: 'Movimentação de estoque criada com sucesso',
      data: createdStockMovement,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesCoordinator))
  @Get(':id/stock-movement')
  async findByProduct(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRODUCTS] Get stock movements | productId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    const data = await this.stockMovementService.findByProduct(id);

    return {
      message: 'Movimentações de estoque retornadas com sucesso',
      data,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesCoordinator))
  @Get('grid/prices')
  async getProductGridPrices(
    @Param('companyId', ParseIntPipe) companyId: number,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRODUCTS] Get grid prices request | companyId: ${companyId} | userId: ${userId}`,
    );

    const products = await this.productsService.findAll(companyId, {
      page: 1,
      limit: 1000,
    });

    const priceResults = [];
    for (const product of products.data) {
      const priceMap = await this.pricingService.calculatePriceForProductGrid(
        product.id,
        companyId,
      );

      priceResults.push({
        productId: product.id,
        productName: product.name,
        basePrice: product.price,
        minPrice: (product as any).minPrice,
        prices: Array.from(priceMap.entries()).map(([tableId, result]) => ({
          tableId,
          finalPrice: result.finalPrice,
          isManual: result.isManual,
          isCappedByMinPrice: result.isCappedByMinPrice,
        })),
      });
    }

    logger.info(
      `[PRODUCTS] Grid prices retrieved | companyId: ${companyId} | userId: ${userId} | productsCount: ${priceResults.length}`,
    );

    return {
      message: 'Preços dos produtos retornados com sucesso',
      data: priceResults,
      metadata: products.metadata,
    };
  }

  @Roles(...getRolesAccessibleByRole(UserRole.SalesCoordinator))
  @Patch(':id/price-override')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updatePriceOverride(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePriceOverrideDto: UpdatePriceOverrideDto,
    @AuthAdministrator() user: AuthenticatedUserDto,
  ) {
    const userId = this.getUserId(user);
    logger.info(
      `[PRODUCTS] Update price override | productId: ${id} | companyId: ${companyId} | userId: ${userId} | priceTableId: ${updatePriceOverrideDto.priceTableId}`,
    );

    const updatedItem = await this.pricingService.updateManualPrice(
      id,
      updatePriceOverrideDto.priceTableId,
      updatePriceOverrideDto.manualPrice,
    );

    logger.info(
      `[PRODUCTS] Price override updated | productId: ${id} | companyId: ${companyId} | userId: ${userId}`,
    );

    return {
      message: 'Preço manual atualizado com sucesso',
      data: updatedItem,
    };
  }
}
