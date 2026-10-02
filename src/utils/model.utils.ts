import { ModelStatic } from 'sequelize-typescript';

/**
 * Gets all association paths from a Sequelize model
 */
export function getIncludePaths(modelClass: ModelStatic<any>): Array<{
  association: string;
  model: ModelStatic<any>;
}> {
  const associations: Array<{ association: string; model: ModelStatic<any> }> =
    [];

  // Get all associations from the model using type assertion
  // This is necessary because TypeScript doesn't recognize associations as a property
  const modelAssociations = Object.values(
    (modelClass as any).associations || {},
  );

  for (const association of modelAssociations) {
    associations.push({
      association: (association as any).as || (association as any).target.name,
      model: (association as any).target,
    });
  }

  return associations;
}

/**
 * Builds include options for Sequelize queries
 * @param modelClass The Sequelize model class
 * @param options Optional configuration
 * @returns An array of include objects for Sequelize queries
 */
export function buildIncludeOptions(
  modelClass: ModelStatic<any>,
  options: {
    recursive?: boolean;
    depth?: number;
    excludeAssociations?: string[];
    includeOnly?: string[];
  } = {},
): any[] {
  const {
    recursive = false,
    depth = 1,
    excludeAssociations = [],
    includeOnly = [],
  } = options;

  if (depth <= 0) return [];

  const associations = getIncludePaths(modelClass);

  return associations
    .filter(({ association }) => {
      // Filter associations based on include/exclude options
      if (includeOnly.length > 0) {
        return includeOnly.includes(association);
      }
      return !excludeAssociations.includes(association);
    })
    .map(({ association, model }) => {
      const include: any = {
        association,
      };

      // Add nested includes if recursive is true
      if (recursive) {
        const nestedIncludes = buildIncludeOptions(model, {
          recursive,
          depth: depth - 1,
          excludeAssociations,
          includeOnly,
        });

        if (nestedIncludes.length > 0) {
          include.include = nestedIncludes;
        }
      }

      return include;
    });
}

/**
 * Generates include options for the most common use case
 * @param modelClass The Sequelize model class
 * @returns An array of include options for immediate associations
 */
export function getDefaultIncludes(modelClass: ModelStatic<any>): any[] {
  return buildIncludeOptions(modelClass, { recursive: false });
}

/**
 * Builds a complete include configuration with the given depth
 * @param modelClass The Sequelize model class
 * @param depth How many levels of nested associations to include
 * @returns An array of include options with nested includes
 */
export function buildNestedIncludes(
  modelClass: ModelStatic<any>,
  depth: number = 2,
): any[] {
  return buildIncludeOptions(modelClass, {
    recursive: true,
    depth,
  });
}
