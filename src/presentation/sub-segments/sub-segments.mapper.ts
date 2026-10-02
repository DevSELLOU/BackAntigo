import { Injectable } from '@nestjs/common';
import { CreateSubSegmentDto } from './dtos/create-sub-segment.dto';
import { UpdateSubSegmentDto } from './dtos/update-sub-segment.dto';
import { SubSegment } from './sub-segment.entity';

@Injectable()
export class SubSegmentsMapper {
  constructor() {}

  async createSubSegmentDtoToSubSegment(
    createSubSegmentDto: CreateSubSegmentDto,
    segmentId: number,
  ): Promise<SubSegment> {
    const subSegment = new SubSegment();
    subSegment.name = createSubSegmentDto.name;
    subSegment.segmentId = segmentId;

    return subSegment;
  }

  async updateSubSegmentDtoToSubSegment(
    currentSubSegment: SubSegment,
    updateSubSegmentDto: UpdateSubSegmentDto,
  ): Promise<SubSegment> {
    if (updateSubSegmentDto.name)
      currentSubSegment.name = updateSubSegmentDto.name;

    return currentSubSegment;
  }
}
