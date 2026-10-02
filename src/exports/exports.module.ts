import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { ExportsService } from './exports.service';
import { CsvService } from './services/csv.service';
import { FieldTransformerService } from './services/field-tranformer.service';
import { PdfService } from './services/pdf.service';

@Module({
  imports: [UploadsModule],
  providers: [ExportsService, PdfService, CsvService, FieldTransformerService],
  exports: [ExportsService],
})
export class ExportsModule {}
