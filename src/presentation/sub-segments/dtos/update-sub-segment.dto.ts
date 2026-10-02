import { PartialType } from '@nestjs/swagger';
import { CreateSubSegmentDto } from './create-sub-segment.dto';

export class UpdateSubSegmentDto extends PartialType(CreateSubSegmentDto) {}
