import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
}

export class ExportDataDto {
  @ApiPropertyOptional({
    description: `Termo usado para busca global em todos os campos da entidade (ex.: 'nome', 'e-mail'). 
    - **Não diferencia maiúsculas de minúsculas**.
    - **Diferencia caracteres acentuados** (ex.: 'lucas' ≠ 'lúcas').`,
  })
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description:
      'Parâmetros de ordenação em formato JSON string, pode ser um campo ou mais. Ex: {"field":"asc|desc", field2: "asc|desc"}',
    example: '{"name":"asc","createdAt":"desc"}',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: `Parâmetros de filtro em formato JSON string, pode ser um campo ou mais. Ex: {"field":{"eq":"value"}, field2: {"gte":"value"}}
      - Operadores disponíveis: eq, ne, gt, gte, lt, lte, in, nin, like (use % para representar qualquer caractere antes ou depois da string)`,
    example: '{"name":{"like":"%john doe%"},"createdAt":{"gte":"2021-01-01"}}',
  })
  @IsOptional()
  @IsString()
  filters?: string;

  @ApiPropertyOptional({
    description: 'Formato da exportação (pdf ou csv)',
    enum: ExportFormat,
    default: ExportFormat.CSV,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;

  @ApiPropertyOptional({
    description:
      'Campos selecionados para exportação em formato CSV, separados por ponto e vírgula (se não informado, exporta todos os campos)',
    example: 'name;description;movieGenre',
  })
  @IsOptional()
  @IsString()
  selectedFields?: string;
}
