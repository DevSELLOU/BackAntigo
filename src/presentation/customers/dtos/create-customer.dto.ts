import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { CustomerTaxRegime } from '../enums/customer-tax-regime.enum';
import { CustomerStatus } from '../enums/customer-status.enum';
import { CustomerType } from '../enums/customer-type.enum';
import { CustomerAddressDto } from './customer-address.dto';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'O campo Razão Social não pode estar vazio' })
  corporateName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'O campo Nome Fantasia não pode estar vazio' })
  fantasyName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'O campo CPF/CNPJ não pode estar vazio' })
  @Matches(/^[0-9]{11}$|^[0-9]{14}$/, {
    message:
      'O campo CPF/CNPJ deve conter 11 dígitos para CPF e 14 dígitos para CNPJ',
  })
  @IsString()
  document: string;

  @ApiProperty()
  @IsNumber()
  creditLimit: number;

  @ApiPropertyOptional({
    description:
      'Inscrição Estadual (opcional), deve conter 9 dígitos ou ser "ISENTO"',
  })
  @IsString()
  @IsOptional()
  @Matches(/(^$|^[0-9]{9}$|^ISENTO$)/, {
    message:
      'A Inscrição Estadual deve conter 9 dígitos, estar vazia ou ser "ISENTO"',
  })
  stateRegistration?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Matches(/(^$|^[0-9]{13}$)/, {
    message: 'O GLN deve conter 13 dígitos',
  })
  gln?: string | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'O campo CEP não pode estar vazio' })
  @Matches(/^[0-9]{8}$/, { message: 'O campo CEP deve conter 8 dígitos' })
  cep: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'O campo Endereço não pode estar vazio' })
  address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'O campo Cidade não pode estar vazio' })
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'O UF não pode estar vazio' })
  UF: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'O campo Bairro não pode estar vazio' })
  neighborhood: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'O campo Telefone não pode estar vazio' })
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  companyPhone?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'O campo email não pode estar vazio' })
  email: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  youtubeUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  segment?: string;

  @ApiPropertyOptional({
    enum: CustomerTaxRegime,
    default: CustomerTaxRegime.SimplesNacional,
  })
  @IsString()
  @IsEnum(CustomerTaxRegime)
  @IsOptional()
  taxRegime?: CustomerTaxRegime;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  taxWithholding?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  operationNature?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bank?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  agency?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  account?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accountType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  invoiceEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orderEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingEmail?: string;

  @ApiPropertyOptional({
    description:
      'Código do grupo de cliente (opcional). Relaciona múltiplos CNPJs do mesmo cliente.',
  })
  @IsString()
  @IsOptional()
  customerGroupCode?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  subSegmentId: number;

  @ApiPropertyOptional({
    enum: CustomerStatus,
    default: CustomerStatus.Active,
  })
  @IsString()
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiPropertyOptional({ enum: CustomerType })
  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType;

  @ApiPropertyOptional({
    description: 'Tags associadas ao cliente',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  primaryContactName?: string;

  @ApiPropertyOptional({
    description: 'Lista de e-mails do cliente',
    type: [String],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  emails?: string[];

  @ApiPropertyOptional({
    description: 'Lista de telefones do cliente',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  phones?: string[];

  @ApiPropertyOptional({ type: CustomerAddressDto })
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  @IsOptional()
  billingAddress?: CustomerAddressDto;

  @ApiPropertyOptional({ type: CustomerAddressDto })
  @ValidateNested()
  @Type(() => CustomerAddressDto)
  @IsOptional()
  shippingAddress?: CustomerAddressDto;

  @ApiPropertyOptional({
    type: [Number],
    description: 'IDs dos vendedores responsáveis pelo cliente',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  sellerIds?: number[];
}
