import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateScheduledVisitDto,
  ScheduledVisitDayQuery,
} from '../../src/routes-visits/dtos/scheduled-visit.dto';

describe('scheduled visit input validation', () => {
  const valid = {
    customerId: 1,
    userId: 2,
    scheduledDate: '2026-10-16',
    scheduledTime: '09:30',
  };
  it('accepts a date and wall-clock time', async () => {
    expect(
      await validate(plainToInstance(CreateScheduledVisitDto, valid)),
    ).toHaveLength(0);
  });
  it.each([
    { scheduledDate: '2026-02-30' },
    { scheduledDate: '2026-10-16T00:00:00Z' },
    { scheduledTime: '24:00' },
    { scheduledTime: '09:60' },
    { scheduledTime: null },
    { customerId: -1 },
    { userId: 1.5 },
  ])('rejects invalid values %j', async (changes) => {
    expect(
      (
        await validate(
          plainToInstance(CreateScheduledVisitDto, { ...valid, ...changes }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });
  it.each([undefined, '2026-02-30', '2026-10-16T00:00:00Z'])(
    'requires an exact valid agenda date %s',
    async (date) => {
      expect(
        (await validate(plainToInstance(ScheduledVisitDayQuery, { date })))
          .length,
      ).toBeGreaterThan(0);
    },
  );
});
