import { BadRequestException } from '@nestjs/common';
import { Op } from 'sequelize';
import { WhereOptions } from 'sequelize';
import { DashboardDTO } from 'src/dashboard/dtos/dashboard.dto';

export interface ParsedMonthYearFilters {
  monthRanges: Array<[Date, Date]>;
  yearRanges: Array<[Date, Date]>;
  dateWhere: WhereOptions;
}

export function parseMonthYearFilters(
  filter: Pick<DashboardDTO, 'months' | 'years'>,
): ParsedMonthYearFilters {
  const monthRanges: Array<[Date, Date]> = [];
  const yearRanges: Array<[Date, Date]> = [];
  const dateConditions: WhereOptions[] = [];

  if (filter.months && filter.months.length > 0) {
    for (const monthStr of filter.months) {
      const [year, month] = monthStr.split('-').map(Number);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        throw new BadRequestException(
          `Invalid month format in months parameter: ${monthStr}`,
        );
      }
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      monthRanges.push([startDate, endDate]);
      dateConditions.push({
        createdAt: { [Op.between]: [startDate, endDate] },
      });
    }
  }

  if (filter.years && filter.years.length > 0) {
    for (const yearStr of filter.years) {
      const year = Number(yearStr);
      if (isNaN(year)) {
        throw new BadRequestException(
          `Invalid year format in years parameter: ${yearStr}`,
        );
      }
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      yearRanges.push([startDate, endDate]);
      dateConditions.push({
        createdAt: { [Op.between]: [startDate, endDate] },
      });
    }
  }

  const dateWhere: WhereOptions =
    dateConditions.length > 0 ? { [Op.or]: dateConditions } : {};

  return { monthRanges, yearRanges, dateWhere };
}
