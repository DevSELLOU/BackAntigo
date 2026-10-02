import { Op, Sequelize } from 'sequelize';

const FULLTEXT_CONFIG = 'portuguese';

function escapeSingleQuotes(value: string): string {
  return value.replace(/'/g, "''");
}

function escapeFulltextQuery(value: string): string {
  return value
    .replace(/'/g, "''")
    .replace(/[&|!():*<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tsVectorExpression(
  columns: string[],
  tableAlias?: string,
): string {
  const prefix = tableAlias ? `"${tableAlias}".` : '';
  const parts = columns.map((column) => `coalesce(${prefix}"${column}", '')`);
  return `to_tsvector('${FULLTEXT_CONFIG}', ${parts.join(" || ' ' || ")})`;
}

export function tsQueryExpression(query: string): string {
  return `websearch_to_tsquery('${FULLTEXT_CONFIG}', '${escapeFulltextQuery(
    query.trim(),
  )}')`;
}

export function buildFullTextSearchWhere(
  columns: string[],
  query: string,
  tableAlias?: string,
) {
  return Sequelize.where(
    Sequelize.literal(tsVectorExpression(columns, tableAlias)),
    Op.match,
    Sequelize.literal(tsQueryExpression(query)),
  );
}

export function createFullTextIndexSql(
  tableName: string,
  indexName: string,
  columns: string[],
): string {
  return `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" USING gin (${tsVectorExpression(
    columns,
  )})`;
}
