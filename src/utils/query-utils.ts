import { DataTypes, Model, ModelStatic, Op, Sequelize } from 'sequelize';
import { getAttributeDataType, isNumeric } from './sequelize.helpers';

function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

export function handleSpecialTypeFilters(filter: any): any {
  if (!filter) return filter;

  if (typeof filter === 'object' && !Array.isArray(filter)) {
    const result = {};
    for (const key in filter) {
      if (typeof filter[key] === 'object' && filter[key] !== null) {
        result[key] = handleSpecialTypeFilters(filter[key]);
      } else {
        result[key] = filter[key];
      }
    }
    return result;
  }

  if (Array.isArray(filter)) {
    return filter.map(handleSpecialTypeFilters);
  }

  return filter;
}

export function buildFilterQuery(
  filters: any,
  model?: ModelStatic<Model>,
): any {
  const filterQuery: any = {};

  if (!filters) {
    return filterQuery;
  }

  for (const [field, value] of Object.entries(filters)) {
    if (field.includes('.')) {
      const [modelName, fieldName] = field.split('.');
      const key = `$${modelName}.${fieldName}$`;
      if (!filterQuery[key]) {
        filterQuery[key] = value;
      }
      continue;
    }

    let key = field;
    if (model) {
      key = `$${model.name}.${field}$`;
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const filterConditions: any = {};
      let isOperatorObject = false;

      for (const [operator, opValue] of Object.entries(value)) {
        let sequelizeOperator;
        const colKey = model ? `${model.name}.${field}` : field;

        if (model && (operator === 'like' || operator === 'iLike')) {
          const fieldType = getAttributeDataType(model, field);

          if (isNumeric(fieldType)) {
            filterQuery[field] = Sequelize.where(
              Sequelize.cast(
                Sequelize.cast(Sequelize.col(colKey), 'DECIMAL'),
                'TEXT',
              ),
              {
                [operator === 'iLike'
                  ? Op.iLike
                  : Op.like]: `%${escapeLikePattern(String(opValue))}%`,
              },
            );
            isOperatorObject = true;
            break;
          }
        }

        switch (operator) {
          case 'eq':
            sequelizeOperator = Op.eq;
            break;
          case 'ne':
            sequelizeOperator = Op.ne;
            break;
          case 'gt':
            sequelizeOperator = Op.gt;
            break;
          case 'lt':
            sequelizeOperator = Op.lt;
            break;
          case 'gte':
            sequelizeOperator = Op.gte;
            break;
          case 'lte':
            sequelizeOperator = Op.lte;
            break;
          case 'in':
            sequelizeOperator = Op.in;
            break;
          case 'nin':
            sequelizeOperator = Op.notIn;
            break;
          case 'like':
            sequelizeOperator = Op.like;
            break;
          case 'iLike':
            sequelizeOperator = Op.iLike;
            break;
          case 'notLike':
            sequelizeOperator = Op.notLike;
            break;
          case 'between':
            sequelizeOperator = Op.between;
            break;
          case 'notBetween':
            sequelizeOperator = Op.notBetween;
            break;
          default:
            break;
        }

        if (sequelizeOperator) {
          if (
            sequelizeOperator === Op.like ||
            sequelizeOperator === Op.iLike ||
            sequelizeOperator === Op.notLike
          ) {
            filterConditions[sequelizeOperator] = `%${escapeLikePattern(
              String(opValue),
            )}%`;
          } else {
            filterConditions[sequelizeOperator] = opValue;
          }
          isOperatorObject = true;
        }
      }

      if (isOperatorObject) {
        if (
          (Object.keys(filterConditions).length > 0 ||
            Reflect.ownKeys(filterConditions).length > 0) &&
          !filterQuery.hasOwnProperty(key)
        ) {
          filterQuery[key] = filterConditions;
        }
      } else if (!filterQuery.hasOwnProperty(key)) {
        if (Object.keys(value).length > 0) {
          filterQuery[key] = value;
        }
      }
    } else {
      filterQuery[key] = value;
    }
  }

  return filterQuery;
}

export function buildSortQuery(sort: any, model?: ModelStatic<Model>): any[] {
  const sortQuery: any[] = [];
  if (sort) {
    for (const [sortField, order] of Object.entries(sort) as [
      string,
      string,
    ][]) {
      const direction = order.toUpperCase();
      const safeDirection = direction === 'DESC' ? 'DESC' : 'ASC';

      if (model) {
        const fieldType = getAttributeDataType(model, sortField);
        if (
          fieldType instanceof DataTypes.STRING ||
          fieldType instanceof DataTypes.TEXT
        ) {
          // Accent-insensitive, case-insensitive ordering — otherwise Postgres'
          // default collation sorts accented letters (á, é, ç...) after every
          // plain ASCII letter instead of alongside their unaccented neighbors.
          sortQuery.push([
            Sequelize.fn(
              'unaccent',
              Sequelize.fn(
                'lower',
                Sequelize.col(`${model.name}.${sortField}`),
              ),
            ),
            safeDirection,
          ]);
          continue;
        }
      }

      sortQuery.push([sortField, safeDirection]);
    }
  }
  return sortQuery;
}
