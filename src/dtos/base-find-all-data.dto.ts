import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseFindAllDataDto {
  @ApiPropertyOptional({
    description:
      'Número da página para a paginação. Deve ser um valor maior ou igual a 1.',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Quantidade máxima de itens por página.',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: `Termo usado para busca global em todos os campos da entidade (ex.: 'nome', 'e-mail'). 
    - **Não diferencia maiúsculas de minúsculas**.
    - **Diferencia caracteres acentuados** (ex.: 'lucas' ≠ 'lúcas').`,
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description:
      'Parâmetros de ordenação em formato JSON string, pode ser um campo ou mais. Ex: {"name":"asc","createdAt":"desc"}',
    example: '{"name":"asc","createdAt":"desc"}',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: `Parâmetros de filtro em formato JSON string, pode ser um campo ou mais. Ex: {"name":{"iLike":"%john doe%"},"createdAt":{"gte":"2021-01-01"}}
      - Operadores disponíveis: eq, ne, gt, gte, lt, lte, in, nin, like, iLike (use % para representar qualquer caractere antes ou depois da string)`,
    example: '{"name":{"iLike":"%john doe%"},"createdAt":{"gte":"2021-01-01"}}',
  })
  @IsOptional()
  @IsString()
  filters?: string;
}
