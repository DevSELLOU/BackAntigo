import { Segment } from './segment.entity';

export const SegmentsProviders = [
  {
    provide: 'SEGMENT_REPOSITORY',
    useValue: Segment,
  },
];
