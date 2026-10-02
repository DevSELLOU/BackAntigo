import { ExportDataDto } from '../exports/dtos/export-data.dto';

function addFilters(
  exportDto: ExportDataDto,
  filters: Record<string, any>,
): ExportDataDto {
  const updatedDto = { ...exportDto };

  if (updatedDto.filters) {
    try {
      const existingFilters = JSON.parse(updatedDto.filters);
      updatedDto.filters = JSON.stringify({
        ...existingFilters,
        ...filters,
      });
    } catch (e) {
      updatedDto.filters = JSON.stringify(filters);
    }
  } else {
    updatedDto.filters = JSON.stringify(filters);
  }

  return updatedDto;
}

/**
 * Adds companyId to filters in ExportDataDto
 */
export function addCompanyIdToFilters(
  exportDto: ExportDataDto,
  companyId: number,
): ExportDataDto {
  return addFilters(exportDto, { companyId });
}

/**
 * Adds companyId and customerId to filters in ExportDataDto
 */
export function addCompanyAndCustomerIdToFilters(
  exportDto: ExportDataDto,
  companyId: number,
  customerId: number,
): ExportDataDto {
  return addFilters(exportDto, { companyId, customerId });
}

/**
 * Adds customerId to filters in ExportDataDto
 */
export function addCustomerIdToFilters(
  exportDto: ExportDataDto,
  customerId: number,
): ExportDataDto {
  return addFilters(exportDto, { customerId });
}
