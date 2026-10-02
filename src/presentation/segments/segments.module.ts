import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { ExportsModule } from 'src/exports/exports.module';
import { SegmentsController } from './segments.controller';
import { SegmentsMapper } from './segments.mapper';
import { SegmentsProviders } from './segments.providers';
import { SegmentsService } from './segments.service';

@Module({
  imports: [CompaniesModule, ExportsModule],
  providers: [SegmentsService, SegmentsMapper, ...SegmentsProviders],
  controllers: [SegmentsController],
  exports: [SegmentsService],
})
export class SegmentsModule {}
