import { SubSegment } from './sub-segment.entity';

export const SubSegmentsProviders = [
  {
    provide: 'SUB_SEGMENT_REPOSITORY',
    useValue: SubSegment,
  },
];
