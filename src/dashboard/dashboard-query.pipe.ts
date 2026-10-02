import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { DashboardDTO } from './dtos/dashboard.dto';

@Injectable()
export class DashboardQueryPipe
  implements PipeTransform<any, Omit<DashboardDTO, 'companyId'>>
{
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'query') {
      return value;
    }

    const {
      months,
      years,
      state,
      cities,
      products,
      customers,
      sellers,
      managers,
    } = value;

    return {
      ...value,
      months: this._processStringToArray(months),
      years: this._processStringToArray(years),
      state: this._processStringOrArrayToArray(state),
      cities: this._processStringOrArrayToArray(cities),
      products: this._processStringOrArrayToArray(products),
      customers: this._processStringOrArrayToNumberArray(customers),
      sellers: this._processStringOrArrayToNumberArray(sellers),
      managers: this._processStringOrArrayToNumberArray(managers),
    };
  }

  private _processStringToArray(input: string): string[] | undefined {
    if (input === null || input === undefined) {
      return undefined;
    }
    return input.split(',');
  }

  private _processStringOrArrayToArray(
    input: string | string[],
  ): string[] | undefined {
    if (input === null || input === undefined) {
      return undefined;
    }
    if (Array.isArray(input)) {
      return input;
    }
    if (typeof input === 'string' && input.includes(',')) {
      return input.split(',');
    }
    return [input as string];
  }

  private _processStringOrArrayToNumberArray(
    input: string | (string | number)[],
  ): number[] | undefined {
    if (input === null || input === undefined) {
      return undefined;
    }
    let arr: (string | number)[];
    if (Array.isArray(input)) {
      arr = input;
    } else if (typeof input === 'string' && input.includes(',')) {
      arr = input.split(',');
    } else {
      arr = [input as string];
    }
    return arr.map((v) => Number(v)).filter((n) => !isNaN(n));
  }
}
