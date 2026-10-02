import {
  Inject,
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { CompaniesService } from 'src/companies/companies.service';
import { buildFilterQuery, buildSortQuery } from 'src/utils/query-utils';
import { buildFullTextSearchWhere } from 'src/utils/fulltext-utils';
import { CreateStockMovementDto } from '../stock-movement/dtos/create-stock-movement.dto';
import { StockMovement } from '../stock-movement/stock-movement.entity';
import { StockMovementService } from '../stock-movement/stock-movement.service';
import { SubCategory } from '../sub-categories/sub-category.entity';
import { CreateProductDto } from './dtos/create-product.dto';
import { FindAllProductsDto } from './dtos/find-all-products.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { ProductPhoto } from './entities/product-photo.entity';
import { Product } from './entities/product.entity';
import { ProductsMapper } from './products.mapper';
import { UploadsService } from 'src/uploads/uploads.service';
import { getBaseUrlFromURLObject } from 'src/utils/format-url';
import { logger } from 'src/utils/logger';
import * as Papa from 'papaparse';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(CompaniesService)
    private readonly companiesService: CompaniesService,
    @Inject(StockMovementService)
    private readonly stockMovementService: StockMovementService,
    @Inject(ProductsMapper)
    private readonly productsMapper: ProductsMapper,
    @Inject('PRODUCT_REPOSITORY')
    private productsRepository: typeof Product,
    @Inject('SUB_CATEGORY_REPOSITORY')
    private subCategoriesRepository: typeof SubCategory,
    @Inject(UploadsService)
    private readonly uploadsService: UploadsService,
  ) {}

  getModel() {
    return this.productsRepository;
  }

  async createProduct(
    companyId: number,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    logger.info(
      `[PRODUCTS-SERVICE] Creating product | companyId: ${companyId} | name: ${createProductDto.name}`,
    );

    await this.companiesService.findOne(companyId);

    logger.info(
      `[PRODUCTS-SERVICE] Mapping DTO to model | companyId: ${companyId}`,
    );

    const { subCategoryIds, photos, ...productData } = createProductDto;

    const productMapped: Partial<Product> =
      await this.productsMapper.createProductDtoToProduct(productData);

    logger.info(
      `[PRODUCTS-SERVICE] Persisting product to database | companyId: ${companyId}`,
    );

    const product = await this.productsRepository.create({
      ...productMapped.dataValues,
      companyId,
    });

    if (subCategoryIds && subCategoryIds.length > 0) {
      logger.info(
        `[PRODUCTS-SERVICE] Associating subcategories | productId: ${product.id} | count: ${subCategoryIds.length}`,
      );
      const subCategories = await this.subCategoriesRepository.findAll({
        where: { id: subCategoryIds },
      });
      await product.$set('subCategories', subCategories);
    }

    if (photos && photos.length > 0) {
      logger.info(
        `[PRODUCTS-SERVICE] Creating product photos | productId: ${product.id} | count: ${photos.length}`,
      );
      const photosMapped = photos.map((photo) => ({
        ...photo,
        productId: product.id,
      }));
      await this.productsRepository.sequelize.transaction(async (t) => {
        await this.productsRepository.sequelize.models.ProductPhoto.bulkCreate(
          photosMapped,
          { transaction: t },
        );
      });
    }

    logger.info(
      `[PRODUCTS-SERVICE] Product created successfully | productId: ${product.id} | companyId: ${companyId}`,
    );

    return product;
  }

  async findOne(companyId: number, id: number): Promise<Product> {
    await this.companiesService.findOne(companyId);

    const product = await this.productsRepository.findOne({
      where: { id, companyId },
      include: [
        SubCategory,
        // Photo order is meaningful: the first one is the product's cover image
        // and the rest drive the gallery carousel.
        { model: ProductPhoto, separate: true, order: [['id', 'ASC']] },
      ],
    });

    if (!product) throw new NotFoundException('Produto não encontrado');

    if (product.photos.length > 0) {
      for (const photo of product.photos) {
        const lastSlashIndex = photo.url.lastIndexOf('/');
        const filename = photo.url.substring(lastSlashIndex + 1);
        photo.url = await this.uploadsService.getPresignedGetUrl(filename);
      }
    }

    return product;
  }

  async findAll(
    companyId: number,
    findAllDto: FindAllProductsDto,
  ): Promise<{
    data: Product[];
    metadata: { page: number; limit: number; total: number };
  }> {
    try {
      const company = await this.companiesService.findOne(companyId);
      const {
        page = 1,
        limit = 50,
        sort,
        filters,
        query,
        subCategoryIds,
      } = findAllDto;

      const parsedFilters = filters ? JSON.parse(filters) : {};
      const parsedSort = sort ? JSON.parse(sort) : {};

      const { categoryId, subCategoryId, ...remainingFilters } = parsedFilters;

      let subCategoryIdsFromFilters: number[] = [];

      if (categoryId) {
        const subCategories = await this.subCategoriesRepository.findAll({
          where: { categoryId: Number(categoryId) },
          attributes: ['id'],
        });
        subCategoryIdsFromFilters = subCategories.map((sc) => sc.id);
      }

      if (subCategoryId) {
        const subCategoryIdNumber = Number(subCategoryId);
        if (subCategoryIdsFromFilters.length > 0) {
          if (!subCategoryIdsFromFilters.includes(subCategoryIdNumber)) {
            subCategoryIdsFromFilters = [];
          } else {
            subCategoryIdsFromFilters = [subCategoryIdNumber];
          }
        } else {
          subCategoryIdsFromFilters = [subCategoryIdNumber];
        }
      }

      const filterQuery = buildFilterQuery(remainingFilters, Product);

      let sortQuery: any[];
      if (parsedSort && parsedSort.subCategories) {
        // subCategories is a many-to-many relation, not a plain column — there's
        // no single "the" category to sort by, so we order each product by
        // whichever linked subcategory name comes first/last (matching the
        // direction requested) among the ones it has, accent-insensitively.
        const direction =
          String(parsedSort.subCategories).toUpperCase() === 'DESC'
            ? 'DESC'
            : 'ASC';

        sortQuery = [
          [
            Sequelize.literal(`(
              SELECT unaccent(lower(sc.name))
              FROM "ProductSubCategories" psc
              JOIN "SubCategories" sc ON sc.id = psc."subCategoryId"
              WHERE psc."productId" = "Product".id
              ORDER BY unaccent(lower(sc.name)) ${direction}
              LIMIT 1
            )`),
            direction,
          ],
        ];
      } else {
        sortQuery = buildSortQuery(parsedSort, Product);
      }

      if (Array.isArray(sortQuery)) {
        sortQuery.unshift(['favorite', 'DESC']);
      } else {
        sortQuery = [['favorite', 'DESC']];
      }


      if (query) {
        // Full-text matches whole words only ('note' misses 'Notebook'), so
        // iLike is kept alongside it for type-ahead and for the short
        // identifier fields a rep searches by (reference, barcode, model).
        const partialMatch = `%${query.trim()}%`;

        filterQuery[Op.or] = [
          buildFullTextSearchWhere(['name', 'description'], query, 'Product'),
          Sequelize.where(Sequelize.cast(Sequelize.col('Product.id'), 'TEXT'), {
            [Op.iLike]: partialMatch,
          }),
          { name: { [Op.iLike]: partialMatch } },
          { description: { [Op.iLike]: partialMatch } },
          { reference: { [Op.iLike]: partialMatch } },
          { barcode: { [Op.iLike]: partialMatch } },
          { brand: { [Op.iLike]: partialMatch } },
          { model: { [Op.iLike]: partialMatch } },
        ];
      }

      filterQuery.companyId = company.id;

      let subCategoryIdsNumber: number[] = [];
      if (subCategoryIds) {
        subCategoryIdsNumber = Array.isArray(subCategoryIds)
          ? subCategoryIds.map(Number)
          : [Number(subCategoryIds)];
      }

      if (subCategoryIdsFromFilters.length > 0) {
        subCategoryIdsNumber =
          subCategoryIdsNumber.length > 0
            ? subCategoryIdsNumber.filter((id) =>
                subCategoryIdsFromFilters.includes(id),
              )
            : subCategoryIdsFromFilters;
      }

      const total = await this.productsRepository.count({
        where: filterQuery,
        include: [
          {
            model: SubCategory,
            where:
              subCategoryIdsNumber.length > 0
                ? { id: subCategoryIdsNumber }
                : undefined,
            through: { attributes: [] },
          },
        ],
      });

      const data = await this.productsRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        limit,
        include: [
          {
            model: SubCategory,
            where:
              subCategoryIdsNumber.length > 0
                ? { id: subCategoryIdsNumber }
                : undefined,
            through: { attributes: [] },
          },
          // `separate` runs photos in their own query, so ordering them by id
          // (cover first, then carousel order) cannot leak into the ordering of
          // the product list itself.
          { model: ProductPhoto, separate: true, order: [['id', 'ASC']] },
        ],
      });

      if (data.length === 0) {
        return {
          data: [],
          metadata: { page, limit, total },
        };
      }

      for (const product of data) {
        if (product.photos.length === 0) continue;

        for (const photo of product.photos) {
          const lastSlashIndex = photo.url.lastIndexOf('/');
          const filename = photo.url.substring(lastSlashIndex + 1);
          photo.url = await this.uploadsService.getPresignedGetUrl(filename);
        }
      }

      return {
        data,
        metadata: { page, limit, total },
      };
    } catch (error) {
      logger.error('Error in findAll:', error);
      throw new InternalServerErrorException(
        `Erro ao buscar: ${error.message}`,
      );
    }
  }

  async updateProduct(
    companyId: number,
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    logger.info(
      `[PRODUCTS-SERVICE] Updating product | productId: ${id} | companyId: ${companyId}`,
    );

    await this.companiesService.findOne(companyId);

    const { subCategoryIds, photos, ...productData } = updateProductDto;

    const product = await this.findOne(companyId, id);

    logger.info(`[PRODUCTS-SERVICE] Mapping DTO to model | productId: ${id}`);

    const productMapped = await this.productsMapper.updateProductDtoToProduct(
      product,
      productData,
    );

    await product.update(productMapped);
    await product.save();

    if (subCategoryIds && subCategoryIds.length > 0) {
      logger.info(
        `[PRODUCTS-SERVICE] Updating subcategories | productId: ${id} | count: ${subCategoryIds.length}`,
      );
      const subCategories = await this.subCategoriesRepository.findAll({
        where: { id: subCategoryIds },
      });
      await product.$set('subCategories', subCategories);
    }

    if (photos) {
      logger.info(
        `[PRODUCTS-SERVICE] Updating product photos | productId: ${id} | count: ${photos.length}`,
      );

      const storedPhotos =
        await this.productsRepository.sequelize.models.ProductPhoto.findAll({
          where: { productId: id },
        });

      const newFilenames = photos.map((photo) => {
        const url = getBaseUrlFromURLObject(photo.url);
        const lastSlashIndex = url.lastIndexOf('/');
        return url.substring(lastSlashIndex + 1);
      });

      const photosToDelete = storedPhotos.filter((photo: any) => {
        const lastSlashIndex = photo.url.lastIndexOf('/');
        const filename = photo.url.substring(lastSlashIndex + 1);
        return !newFilenames.includes(filename);
      });

      const photosMapped = photos.map((photo) => {
        photo.url = getBaseUrlFromURLObject(photo.url);
        return {
          ...photo,
          productId: product.id,
        };
      });
      await this.productsRepository.sequelize.transaction(async (t) => {
        await this.productsRepository.sequelize.models.ProductPhoto.destroy({
          where: { productId: product.id },
          transaction: t,
        });
        if (photosMapped.length > 0) {
          await this.productsRepository.sequelize.models.ProductPhoto.bulkCreate(
            photosMapped,
            { transaction: t },
          );
        }
      });

      for (const photo of photosToDelete) {
        const lastSlashIndex = (photo as any).url.lastIndexOf('/');
        const filename = (photo as any).url.substring(lastSlashIndex + 1);
        await this.uploadsService.deleteFile(filename);
      }
    }

    return product;
  }

  async deleteProduct(companyId: number, id: number): Promise<void> {
    logger.info(
      `[PRODUCTS-SERVICE] Deleting product | productId: ${id} | companyId: ${companyId}`,
    );

    await this.companiesService.findOne(companyId);

    const product = await this.findOne(companyId, id);

    logger.info(
      `[PRODUCTS-SERVICE] Product found - deleting | productId: ${id} | name: ${product.name}`,
    );

    await product.destroy();

    logger.info(
      `[PRODUCTS-SERVICE] Product deleted successfully | productId: ${id} | companyId: ${companyId}`,
    );
  }

  async createStockMovement(
    companyId: number,
    createStockMovementDto: CreateStockMovementDto,
  ): Promise<StockMovement> {
    logger.info(
      `[PRODUCTS-SERVICE] Creating stock movement | companyId: ${companyId} | productId: ${createStockMovementDto.productId} | type: ${createStockMovementDto.type}`,
    );

    await this.companiesService.findOne(companyId);

    await this.findOne(companyId, createStockMovementDto.productId);

    const stockMovement = await this.stockMovementService.createStockMovement(
      createStockMovementDto,
    );

    logger.info(
      `[PRODUCTS-SERVICE] Stock movement created | movementId: ${stockMovement.id} | productId: ${createStockMovementDto.productId}`,
    );

    return stockMovement;
  }

  async findAllByIds(ids: number[], companyId?: number): Promise<Product[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const whereClause: any = { id: ids };
    if (companyId) {
      whereClause.companyId = companyId;
    }

    const products = await this.productsRepository.findAll({
      where: whereClause,
    });

    if (products.length !== ids.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = ids.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Produto(s) não encontrado(s): ${missingIds.join(', ')}`,
      );
    }

    return products;
  }

  async importProductsFromCSV(
    companyId: number,
    buffer: Buffer,
    mode: 'create' | 'update' = 'create',
  ): Promise<{ count: number }> {
    await this.companiesService.findOne(companyId);
    logger.log('[CSV Import] Starting import process...');
    const csvData = buffer.toString('utf-8');

    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transform: (value: string, header: string) => {
          if (!value) return value;

          const floatColumns = [
            'preco',
            'altura',
            'comprimento',
            'largura',
            'pesoLiquido',
            'espessura',
            'ipi',
            'st',
            'icms',
          ];

          if (floatColumns.includes(header)) {
            const lastComma = value.lastIndexOf(',');
            const lastDot = value.lastIndexOf('.');
            if (lastComma > lastDot) {
              return value.replace(/\./g, '').replace(',', '.');
            }
            return value.replace(/,/g, '');
          }

          return value;
        },
        complete: async (results) => {
          logger.log(
            `[CSV Import] Parsing complete. Found ${results.data.length} rows.`,
          );
          if (results.errors.length) {
            logger.error('[CSV Import] Error parsing CSV:', results.errors);
            return reject(
              new BadRequestException('Erro ao fazer parse do ficheiro CSV.'),
            );
          }

          try {
            this._validateCSVHeaders(results.meta.fields);
          } catch (error) {
            return reject(error);
          }

          const transaction =
            await this.productsRepository.sequelize.transaction();

          try {
            const data = results.data as any[];
            let count: number;

            if (mode === 'create') {
              logger.log('[CSV Import] Running in "create" mode.');
              count = await this._bulkCreateProducts(
                data,
                companyId,
                transaction,
              );
            } else if (mode === 'update') {
              logger.log('[CSV Import] Running in "update" mode.');
              count = await this._bulkUpdateProducts(
                data,
                companyId,
                transaction,
              );
            }

            await transaction.commit();
            logger.log('[CSV Import] Transaction committed successfully.');
            resolve({ count });
          } catch (error) {
            await transaction.rollback();
            logger.error(
              '[CSV Import] Transaction rolled back due to error:',
              error,
            );
            reject(
              new InternalServerErrorException(
                'Erro ao importar produtos para a base de dados.',
              ),
            );
          }
        },
        error: (error) => {
          logger.error(
            '[CSV Import] Critical error during CSV parsing:',
            error,
          );
          reject(
            new BadRequestException(
              `Erro ao fazer parse do CSV: ${error.message}`,
            ),
          );
        },
      });
    });
  }

  private _validateCSVHeaders(actualHeaders: string[]): void {
    logger.log('[CSV Import] Validating CSV headers...');
    const expectedHeaders = [
      'nome',
      'descricao',
      'preco',
      'ncm',
      'cores',
      'marca',
      'unidadeDeMedida',
      'altura',
      'comprimento',
      'largura',
      'pesoLiquido',
      'espessura',
      'referencia',
      'modelo',
      'estoque',
      'ipi',
      'st',
      'codigoDeBarras',
      'fabricante',
      'icms',
      'codigoCliente',
    ];

    const missingHeaders = expectedHeaders.filter(
      (header) => !actualHeaders.includes(header),
    );

    if (missingHeaders.length > 0) {
      logger.error('[CSV Import] Validation failed. Missing headers:', {
        missingHeaders,
      });
      throw new BadRequestException(
        `O ficheiro CSV não contém as seguintes colunas obrigatórias: ${missingHeaders.join(
          ', ',
        )}`,
      );
    }
    logger.log('[CSV Import] CSV headers are valid.');
  }

  private async _bulkCreateProducts(
    data: any[],
    companyId: number,
    transaction: any,
  ): Promise<number> {
    const productsToCreate = data.map((item) => ({
      name: item.nome,
      description: item.descricao || null,
      price: item.preco ? parseFloat(item.preco) : 0,
      ncm: item.ncm || null,
      colors: item.cores || null,
      brand: item.marca || null,
      unitOfMeasure: item.unidadeDeMedida || null,
      height: item.altura ? parseFloat(item.altura) : null,
      length: item.comprimento ? parseFloat(item.comprimento) : null,
      width: item.largura ? parseFloat(item.largura) : null,
      netWeight: item.pesoLiquido ? parseFloat(item.pesoLiquido) : null,
      thickness: item.espessura ? parseFloat(item.espessura) : null,
      reference: item.referencia || null,
      model: item.modelo || null,
      stock: item.estoque ? parseInt(item.estoque, 10) : 0,
      ipi: item.ipi ? parseFloat(item.ipi) : null,
      st: item.st ? parseFloat(item.st) : null,
      barcode: item.codigoDeBarras || null,
      manufacturer: item.fabricante || null,
      icms: item.icms ? parseFloat(item.icms) : null,
      clientCode: item.codigoCliente || null,
      companyId: companyId,
    }));

    logger.log(
      `[CSV Import] Attempting to bulk create ${productsToCreate.length} products.`,
    );
    const createdProducts = await this.productsRepository.bulkCreate(
      productsToCreate,
      { validate: true, ignoreDuplicates: true, transaction },
    );
    logger.log(
      `[CSV Import] Successfully created ${createdProducts.length} products.`,
    );
    return createdProducts.length;
  }

  private async _bulkUpdateProducts(
    data: any[],
    companyId: number,
    transaction: any,
  ): Promise<number> {
    let updatedCountTotal = 0;
    for (const [index, item] of data.entries()) {
      if (!item.referencia) {
        logger.log(
          `[CSV Import] Skipping row ${
            index + 2
          } for update: missing reference.`,
        );
        continue;
      }

      const productToUpdate = {
        name: item.nome,
        description: item.descricao,
        price: item.preco ? parseFloat(item.preco) : null,
        ncm: item.ncm,
        colors: item.cores,
        brand: item.marca,
        unitOfMeasure: item.unidadeDeMedida,
        height: item.altura ? parseFloat(item.altura) : null,
        length: item.comprimento ? parseFloat(item.comprimento) : null,
        width: item.largura ? parseFloat(item.largura) : null,
        netWeight: item.pesoLiquido ? parseFloat(item.pesoLiquido) : null,
        thickness: item.espessura ? parseFloat(item.espessura) : null,
        model: item.modelo,
        stock: item.estoque ? parseInt(item.estoque, 10) : null,
        ipi: item.ipi ? parseFloat(item.ipi) : null,
        st: item.st ? parseFloat(item.st) : null,
        barcode: item.codigoDeBarras,
        manufacturer: item.fabricante,
        icms: item.icms ? parseFloat(item.icms) : null,
      };

      Object.keys(productToUpdate).forEach(
        (key) =>
          (productToUpdate[key] === undefined ||
            Number.isNaN(productToUpdate[key])) &&
          delete productToUpdate[key],
      );

      const [updatedCount] = await this.productsRepository.update(
        productToUpdate,
        { where: { reference: item.referencia, companyId }, transaction },
      );

      if (updatedCount > 0) {
        updatedCountTotal++;
      }
    }
    logger.log(
      `[CSV Import] Successfully updated ${updatedCountTotal} products.`,
    );
    return updatedCountTotal;
  }
}
