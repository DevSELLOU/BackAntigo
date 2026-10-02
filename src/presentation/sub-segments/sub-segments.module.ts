import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { SegmentsModule } from '../segments/segments.module';
import { SubSegmentsController } from './sub-segments.controller';
import { SubSegmentsMapper } from './sub-segments.mapper';
import { SubSegmentsProviders } from './sub-segments.providers';
import { SubSegmentsService } from './sub-segments.service';

@Module({
  imports: [SegmentsModule, CompaniesModule],
  providers: [SubSegmentsService, SubSegmentsMapper, ...SubSegmentsProviders],
  controllers: [SubSegmentsController],
  exports: [SubSegmentsService, ...SubSegmentsProviders],
})
export class SubSegmentsModule {}
