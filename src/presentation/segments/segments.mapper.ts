import { Injectable } from '@nestjs/common';
import { CreateSegmentDto } from './dtos/create-segment.dto';
import { UpdateSegmentDto } from './dtos/update-segment.dto';
import { Segment } from './segment.entity';

@Injectable()
export class SegmentsMapper {
  constructor() {}

  async createSegmentDtoToSegment(
    createSegmentDto: CreateSegmentDto,
    companyId: number,
  ): Promise<Segment> {
    const segment = new Segment();
    segment.name = createSegmentDto.name;
    segment.description = createSegmentDto.description;
    segment.companyId = companyId;

    return segment;
  }

  async updateSegmentDtoToSegment(
    currentSegment: Segment,
    updateSegmentDto: UpdateSegmentDto,
  ): Promise<Segment> {
    if (updateSegmentDto.name) currentSegment.name = updateSegmentDto.name;

    if (updateSegmentDto.description)
      currentSegment.description = updateSegmentDto.description;

    return currentSegment;
  }
}
