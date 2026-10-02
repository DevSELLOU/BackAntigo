import { Injectable } from '@nestjs/common';
import { Company } from './company.entity';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyPreferencesDto } from './dtos/update-company-preferences.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { getBaseUrlFromURLObject } from 'src/utils/format-url';

@Injectable()
export class CompaniesMapper {
  constructor() {}

  async createCompanyDtoToCompany(
    createCompanyDto: CreateCompanyDto,
  ): Promise<Company> {
    const company = new Company();
    company.corporateName = createCompanyDto.corporateName;
    company.fantasyName = createCompanyDto.fantasyName;
    company.cnpj = createCompanyDto.cnpj;

    return company;
  }

  async updateCompanyDtoToCompany(
    currentCompany: Company,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    if (currentCompany.logoUrl) {
      currentCompany.logoUrl = getBaseUrlFromURLObject(currentCompany.logoUrl);
    }

    if (updateCompanyDto.corporateName)
      currentCompany.corporateName = updateCompanyDto.corporateName;

    if (updateCompanyDto.fantasyName)
      currentCompany.fantasyName = updateCompanyDto.fantasyName;

    if (updateCompanyDto.status)
      currentCompany.status = updateCompanyDto.status;

    if (updateCompanyDto.cnpj) currentCompany.cnpj = updateCompanyDto.cnpj;

    return currentCompany;
  }

  async updateCompanyPreferencesDtoToCompany(
    currentCompany: Company,
    updateCompanyDto: UpdateCompanyPreferencesDto,
  ): Promise<Company> {
    if (currentCompany.logoUrl) {
      currentCompany.logoUrl = getBaseUrlFromURLObject(currentCompany.logoUrl);
    }

    // What the form posts back is whatever it was shown, and it was shown a PRESIGNED url. Storing
    // that verbatim puts the signature inside the object key, so the next read signs a key that
    // does not exist. Normalising here is the same thing `products.service.ts` already does for
    // product photos before persisting them.
    //
    // This used to be guarded by `length < 255`, which rejected presigned urls only because they
    // happen to be ~600 characters — accidental protection that also silently dropped any
    // legitimately long filename.
    if (updateCompanyDto.logoUrl)
      currentCompany.logoUrl = getBaseUrlFromURLObject(updateCompanyDto.logoUrl);

    if (updateCompanyDto.customColor)
      currentCompany.customColor = updateCompanyDto.customColor;

    if (updateCompanyDto.shopColor)
      currentCompany.shopColor = updateCompanyDto.shopColor;

    // Same treatment as the logo: what arrives from the form is a presigned URL, and the signature
    // must not be persisted — only the stable object address is stored, and re-signed on read.
    if (currentCompany.coverUrl) {
      currentCompany.coverUrl = getBaseUrlFromURLObject(currentCompany.coverUrl);
    }

    if (updateCompanyDto.coverUrl !== undefined)
      currentCompany.coverUrl = updateCompanyDto.coverUrl
        ? getBaseUrlFromURLObject(updateCompanyDto.coverUrl)
        : null;

    // These use `!== undefined` rather than a truthy check so an empty string clears the field.
    // A shopkeeper who typed an address once has to be able to remove it again.
    if (updateCompanyDto.about !== undefined)
      currentCompany.about = updateCompanyDto.about?.trim() || null;

    if (updateCompanyDto.whatsapp !== undefined)
      currentCompany.whatsapp = updateCompanyDto.whatsapp?.trim() || null;

    if (updateCompanyDto.phone !== undefined)
      currentCompany.phone = updateCompanyDto.phone?.trim() || null;

    if (updateCompanyDto.address !== undefined)
      currentCompany.address = updateCompanyDto.address?.trim() || null;

    if (updateCompanyDto.businessHours !== undefined)
      currentCompany.businessHours =
        updateCompanyDto.businessHours?.trim() || null;

    if (typeof updateCompanyDto.allowOrdersWithoutStock === 'boolean')
      currentCompany.allowOrdersWithoutStock =
        updateCompanyDto.allowOrdersWithoutStock;

    return currentCompany;
  }
}
