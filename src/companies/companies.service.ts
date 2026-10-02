import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { buildFilterQuery, buildSortQuery } from 'src/utils/query-utils';
import { buildFullTextSearchWhere } from 'src/utils/fulltext-utils';
import { CompaniesMapper } from './companies.mapper';
import { Company } from './company.entity';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyPreferencesDto } from './dtos/update-company-preferences.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { CompanyStatus } from './enums/company-status.enum';
import { UploadsService } from 'src/uploads/uploads.service';

@Injectable()
export class CompaniesService {
  constructor(
    @Inject(CompaniesMapper)
    private readonly companiesMapper: CompaniesMapper,
    @Inject('COMPANY_REPOSITORY')
    private companiesRepository: typeof Company,
    private readonly uploadsService: UploadsService,
  ) {}

  getModel(): typeof Company {
    return Company;
  }

  private async companyExists(cnpj: string): Promise<boolean> {
    const company = await this.companiesRepository.findOne({
      where: { cnpj: cnpj },
    });

    return !!company;
  }

  async createCompany(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const companyExists = await this.companyExists(createCompanyDto.cnpj);
    if (companyExists)
      throw new NotFoundException('Empresa já cadastrada com o CNPJ informado');

    const companyMapped: Partial<Company> =
      await this.companiesMapper.createCompanyDtoToCompany(createCompanyDto);

    const company = await this.companiesRepository.create(
      companyMapped.dataValues,
    );

    return company;
  }

  /**
   * Swaps the stored object addresses for presigned URLs the browser can actually load.
   *
   * This block used to be copy-pasted into `findOne`, `findCompanyPublic` and
   * `findCompanyPublicByFantasyName`; the storefront cover would have made it a fourth copy.
   */
  private async signCompanyImages(company: Company): Promise<void> {
    company.logoUrl = await this.signStoredImage(company.logoUrl);
    company.coverUrl = await this.signStoredImage(company.coverUrl);
  }

  private async signStoredImage(storedUrl?: string): Promise<string> {
    if (!storedUrl) return storedUrl;

    const filename =
      storedUrl.startsWith('http://') || storedUrl.startsWith('https://')
        ? await this.uploadsService.getFilenameFromUrl(storedUrl)
        : storedUrl;

    return this.uploadsService.getPresignedGetUrl(filename, 3600);
  }

  async findOne(id: number): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: { id: id },
    });

    if (!company) throw new NotFoundException('Empresa não encontrada');

    await this.signCompanyImages(company);

    return company;
  }

  async findAll(findAllDto: BaseFindAllDataDto): Promise<{
    data: Company[];
    metadata: { page: number; limit: number; total: number };
  }> {
    try {
      const { page = 1, limit = 10, sort, filters, query } = findAllDto;

      const parsedFilters = filters ? JSON.parse(filters) : {};
      const parsedSort = sort ? JSON.parse(sort) : {};

      const filterQuery = buildFilterQuery(parsedFilters);
      const sortQuery = buildSortQuery(parsedSort);

      if (query) {
        filterQuery[Op.or] = [
          buildFullTextSearchWhere(['corporateName', 'fantasyName'], query),
          { cnpj: { [Op.iLike]: `%${query}%` } },
          Sequelize.where(Sequelize.cast(Sequelize.col('id'), 'TEXT'), {
            [Op.iLike]: `%${query}%`,
          }),
        ];
      }

      const total = await this.companiesRepository.count({
        where: filterQuery,
      });

      const data = await this.companiesRepository.findAll({
        where: filterQuery,
        order: sortQuery,
        offset: (page - 1) * limit,
        limit,
      });

      return {
        data,
        metadata: { page, limit, total },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Erro ao buscar: ${error.message}`,
      );
    }
  }

  async findCompanyPublic(id: number): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: { id: id },
      attributes: [
        'id',
        'corporateName',
        'fantasyName',
        'logoUrl',
        'customColor',
        'shopColor',
        // The storefront identity block. This list is explicit, so a new column on the entity
        // reaches the shop only once it is named here.
        'coverUrl',
        'about',
        'whatsapp',
        'phone',
        'address',
        'businessHours',
      ],
    });

    if (!company) throw new NotFoundException('Empresa não encontrada');

    await this.signCompanyImages(company);

    return company;
  }

  async findCompanyPublicByFantasyName(fantasyName: string): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: {
        fantasyName: {
          [Op.iLike]: fantasyName,
        },
      },
      attributes: [
        'id',
        'corporateName',
        'fantasyName',
        'logoUrl',
        'customColor',
        'shopColor',
        // The storefront identity block. This list is explicit, so a new column on the entity
        // reaches the shop only once it is named here.
        'coverUrl',
        'about',
        'whatsapp',
        'phone',
        'address',
        'businessHours',
      ],
    });

    if (!company) throw new NotFoundException('Empresa não encontrada');

    await this.signCompanyImages(company);

    return company;
  }

  async updateCompany(
    id: number,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findOne(id);

    const companyMapped = await this.companiesMapper.updateCompanyDtoToCompany(
      company,
      updateCompanyDto,
    );

    const companyExists = await this.companyExists(companyMapped.cnpj);
    if (companyExists && company.cnpj !== companyMapped.cnpj)
      throw new NotFoundException('Empresa já cadastrada com o CNPJ informado');

    await company.update(companyMapped);
    await company.save();

    return company;
  }

  async deleteCompany(id: number): Promise<void> {
    const company = await this.findOne(id);

    await company.destroy();
  }

  async updateCompanyPreferences(
    id: number,
    preferences: UpdateCompanyPreferencesDto,
  ) {
    const company = await this.findOne(id);

    const companyMapped =
      await this.companiesMapper.updateCompanyPreferencesDtoToCompany(
        company,
        preferences,
      );

    await company.update(companyMapped);
    await company.save();

    return company;
  }

  async getNumberOfActiveCompanies() {
    const companies = await this.companiesRepository.findAll({
      where: { status: CompanyStatus.Active },
    });

    return companies.length;
  }
}
