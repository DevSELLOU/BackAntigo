import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Model, ModelStatic, Op } from 'sequelize';
import { buildIncludeOptions } from 'src/utils/model.utils';
import { buildFilterQuery, buildSortQuery } from 'src/utils/query-utils';
import { Readable } from 'stream';
import { UploadsService } from '../uploads/uploads.service';
import { ExportDataDto } from './dtos/export-data.dto';
import { CsvService } from './services/csv.service';
import { FieldTransformerService } from './services/field-tranformer.service';
import { PdfService } from './services/pdf.service';

@Injectable()
export class ExportsService {
  constructor(
    private readonly csvService: CsvService,
    private readonly pdfService: PdfService,
    private readonly fieldTransformerService: FieldTransformerService,
    @Inject(UploadsService)
    private readonly uploadsService: UploadsService,
  ) {}

  async exportData<T extends Model>(
    modelClass: ModelStatic<T>,
    exportDto: ExportDataDto,
    entityType: string,
    title: string,
    format: 'pdf' | 'csv' = 'csv',
    queryableFields?: string[],
    selectFields?: string[],
  ): Promise<{ fileUrl: string; filename: string }> {
    try {
      // Step 1: Process filters and sort parameters
      const { filterQuery, sortQuery } = this.prepareQueryParams(
        exportDto,
        queryableFields,
      );

      // Step 2: Fetch and process data in batches
      const batchSize = 500; // Adjust based on your data size
      const totalCount = await modelClass.count({ where: filterQuery });

      // Create a filename with timestamp
      const timestamp = Date.now();
      const filename = `${title
        .toLowerCase()
        .replace(/\s+/g, '-')}-${timestamp}.${format}`;
      const contentType = format === 'pdf' ? 'application/pdf' : 'text/csv';

      // For CSV format - process in batches and stream directly
      if (format === 'csv') {
        // Create a readable stream to pipe data
        const csvStream = new Readable({
          read() {}, // Implement empty read method
        });

        // Start upload with stream
        const uploadPromise = this.uploadsService.uploadFile(
          csvStream,
          filename,
          contentType,
        );

        // Write CSV header first
        const headerFields =
          this.fieldTransformerService.getSelectableFields(entityType);
        const headerRow =
          headerFields.map((field) => field.label).join(',') + '\n';
        csvStream.push(headerRow);

        // Process data in batches
        const batches = Math.ceil(totalCount / batchSize);
        for (let batch = 0; batch < batches; batch++) {
          const batchData = await this.fetchBatchData(
            modelClass,
            filterQuery,
            sortQuery,
            selectFields,
            batch * batchSize,
            batchSize,
          );

          // Transform the batch data
          const transformedData =
            this.fieldTransformerService.transformFieldNames(
              entityType,
              batchData,
            );

          // Convert to CSV (without headers since we already wrote them)
          const csvRows = this.csvService.generateCsvRows(transformedData);
          csvStream.push(csvRows);
        }

        // End the stream
        csvStream.push(null);

        // Wait for upload to complete
        const fileUrl = await uploadPromise;
        return { fileUrl, filename };
      }
      // For PDF format - still need to collect all data, but in batches
      else {
        let allTransformedData = [];
        const batches = Math.ceil(totalCount / batchSize);

        for (let batch = 0; batch < batches; batch++) {
          const batchData = await this.fetchBatchData(
            modelClass,
            filterQuery,
            sortQuery,
            selectFields,
            batch * batchSize,
            batchSize,
          );

          // Transform the batch data
          const transformedBatch =
            this.fieldTransformerService.transformFieldNames(
              entityType,
              batchData,
            );

          allTransformedData = [...allTransformedData, ...transformedBatch];
        }

        // Generate PDF with all data
        const pdfData = await this.pdfService.generatePdf(
          allTransformedData,
          title,
          entityType,
        );

        // Create stream and upload
        const stream = new Readable();
        stream.push(pdfData);
        stream.push(null);

        const fileUrl = await this.uploadsService.uploadFile(
          stream,
          filename,
          contentType,
        );

        return { fileUrl, filename };
      }
    } catch (error) {
      throw new BadRequestException(`Error exporting data: ${error.message}`);
    }
  }

  private async fetchBatchData<T extends Model>(
    modelClass: ModelStatic<T>,
    filterQuery: any,
    sortQuery: any[],
    selectFields?: string[],
    offset: number = 0,
    limit: number = 500,
  ) {
    // Build include options with reduced depth
    const include = buildIncludeOptions(modelClass, {
      recursive: true,
      depth: 1, // Reduced depth to minimize memory usage
    });

    // Prepare attributes to select
    const attributes =
      selectFields && selectFields.length > 0 ? selectFields : undefined;

    // Use Sequelize findAll with batch options
    const data = await modelClass.findAll({
      where: filterQuery,
      order: sortQuery.length > 0 ? sortQuery : undefined,
      include,
      attributes,
      offset,
      limit,
    });

    // Convert Sequelize instances to plain objects
    return data.map((item) => item.get({ plain: true }));
  }

  private prepareQueryParams(
    exportDto: ExportDataDto,
    queryableFields?: string[],
  ) {
    const { filters, sort, query } = exportDto;

    const parsedFilters = filters ? JSON.parse(filters) : {};
    const parsedSort = sort ? JSON.parse(sort) : {};

    // Build filter and sort queries
    const filterQuery = buildFilterQuery(parsedFilters);
    const sortQuery = buildSortQuery(parsedSort);

    // Handle query functionality
    if (query) {
      this.addQueryFilters(filterQuery, query, queryableFields);
    }

    return { filterQuery, sortQuery };
  }

  private addQueryFilters(
    filterQuery: any,
    query: string,
    queryFields?: string[],
  ) {
    if (!filterQuery[Op.or]) {
      filterQuery[Op.or] = [];
    }

    if (queryFields) {
      queryFields.forEach((field) => {
        filterQuery[Op.or].push({ [field]: { [Op.iLike]: `%${query}%` } });
      });
    }

    if (!isNaN(parseInt(query))) {
      filterQuery[Op.or].push({ id: parseInt(query) });
    }
  }

  getSelectableFields(entity: string): { field: string; label: string }[] {
    return this.fieldTransformerService.getSelectableFields(entity);
  }
}
