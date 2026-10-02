import { Injectable } from '@nestjs/common';
import { CreatePriceTableDto } from './dtos/create-price-table.dto';
import { UpdatePriceTableStatusDto } from './dtos/update-price-table-status.dto';
import { UpdatePriceTableDto } from './dtos/update-price-table.dto';
import { PriceTable } from './price-table.entity';

@Injectable()
export class PriceTablesMapper {
  constructor() {}

  async createPriceTableDtoToPriceTable(
    createPriceTableDto: CreatePriceTableDto,
  ): Promise<PriceTable> {
    const priceTable = new PriceTable();
    Object.assign(priceTable, createPriceTableDto);

    return priceTable;
  }

  async updatePriceTableDtoToPriceTable(
    currentPriceTable: PriceTable,
    updatePriceTableDto: UpdatePriceTableDto,
  ): Promise<PriceTable> {
    Object.entries(updatePriceTableDto).forEach(([key, value]) => {
      if (value !== undefined) {
        (currentPriceTable as any)[key] = value;
      }
    });

    return currentPriceTable;
  }

  async updatePriceTableStatusDtoToPriceTable(
    currentPriceTable: PriceTable,
    updatePriceTableStatusDto: UpdatePriceTableStatusDto,
  ): Promise<PriceTable> {
    if (updatePriceTableStatusDto.status)
      currentPriceTable.status = updatePriceTableStatusDto.status;

    return currentPriceTable;
  }
}
