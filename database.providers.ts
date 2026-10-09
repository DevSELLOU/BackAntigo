import { ConfigService } from '@nestjs/config';
import { databaseTlsOptions } from './src/utils/database-tls';
import { Sequelize } from 'sequelize-typescript';
import { EnvironmentVariables } from 'src/env.validation';
import { AccessRequest } from 'src/presentation/access-requests/access-request.entity';
import { CustomerPaymentCondition } from 'src/presentation/customers-payment-conditions/customer-payment-condition.entity';
import { CustomerPaymentMethod } from 'src/presentation/customers-payment-methods/customer-payment-method.entity';
import { PaymentMethod } from 'src/presentation/payment-methods/payment-method.entity';
import { PriceTableItem } from 'src/presentation/price-table-items/price-table-item.entity';
import { PriceTableRule } from 'src/presentation/price-table-rules/price-table-rule.entity';
import { ProductSubCategory } from 'src/presentation/products-sub-categories/product-sub-category.entity';
import { ProductPhoto } from 'src/presentation/products/entities/product-photo.entity';
import { Segment } from 'src/presentation/segments/segment.entity';
import { StockMovement } from 'src/presentation/stock-movement/stock-movement.entity';
import { SubSegment } from 'src/presentation/sub-segments/sub-segment.entity';
import { Company } from './src/companies/company.entity';
import { Category } from './src/presentation/categories/category.entity';
import { Customer } from './src/presentation/customers/customer.entity';
import { CustomerSeller } from './src/presentation/customers/customer-seller.entity';
import { OrderItem } from './src/presentation/order-items/order-item.entity';
import { Order } from './src/presentation/orders/order.entity';
import { OrderResponsibleUser } from './src/presentation/orders/order-responsible-user.entity';
import { PaymentCondition } from './src/presentation/payment-conditions/payment-condition.entity';
import { PriceTable } from './src/presentation/price-tables/price-table.entity';
import { Product } from './src/presentation/products/entities/product.entity';
import { SubCategory } from './src/presentation/sub-categories/sub-category.entity';
import { User } from './src/users/user.entity';
import { UserHierarchy } from 'src/user-hierarchies/user-hierarchy.entity';
import { OrderSetup } from 'src/presentation/order-setups/order-setup.entity';
import { UserGoal } from './src/user-goals/entities/user-goal.entity';
import { UserGoalProduct } from './src/user-goals/entities/user-goal-product.entity';
import { Route } from './src/routes-visits/entities/route.entity';
import { Trip } from './src/routes-visits/entities/trip.entity';
import { VisitRecord } from './src/routes-visits/entities/visit-record.entity';
import { ScheduledVisit } from './src/routes-visits/entities/scheduled-visit.entity';
import { City } from './src/cities/city.entity';
import { UserCompany } from './src/user-companies/user-company.entity';
import { migrateUserCompanies } from './src/user-companies/migrate-user-companies';
import { createFullTextIndexSql } from './src/utils/fulltext-utils';

const FULLTEXT_INDEXES: {
  tableName: string;
  indexName: string;
  columns: string[];
}[] = [
  {
    tableName: 'Companies',
    indexName: 'idx_companies_fulltext',
    columns: ['corporateName', 'fantasyName'],
  },
  {
    tableName: 'Customers',
    indexName: 'idx_customers_fulltext',
    columns: ['corporateName', 'fantasyName'],
  },
  {
    tableName: 'PriceTables',
    indexName: 'idx_price_tables_fulltext',
    columns: ['name', 'description'],
  },
  { tableName: 'Users', indexName: 'idx_users_fulltext', columns: ['name'] },
  {
    tableName: 'PaymentConditions',
    indexName: 'idx_payment_conditions_fulltext',
    columns: ['name', 'description'],
  },
  {
    tableName: 'Categories',
    indexName: 'idx_categories_fulltext',
    columns: ['name', 'description'],
  },
  {
    tableName: 'AccessRequests',
    indexName: 'idx_access_requests_fulltext',
    columns: ['fullName', 'companyName'],
  },
  {
    tableName: 'PaymentMethods',
    indexName: 'idx_payment_methods_fulltext',
    columns: ['name', 'description'],
  },
  {
    tableName: 'SubSegments',
    indexName: 'idx_sub_segments_fulltext',
    columns: ['name'],
  },
  {
    tableName: 'SubCategories',
    indexName: 'idx_sub_categories_fulltext',
    columns: ['name'],
  },
  {
    tableName: 'Segments',
    indexName: 'idx_segments_fulltext',
    columns: ['name', 'description'],
  },
  {
    tableName: 'Orders',
    indexName: 'idx_orders_fulltext',
    columns: ['observation'],
  },
  {
    tableName: 'Products',
    indexName: 'idx_products_fulltext',
    columns: ['name', 'description'],
  },
];

async function createFullTextIndexes(sequelize: Sequelize) {
  for (const { tableName, indexName, columns } of FULLTEXT_INDEXES) {
    await sequelize.query(
      createFullTextIndexSql(tableName, indexName, columns),
    );
  }
}

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async (
      configService: ConfigService<EnvironmentVariables, true>,
    ) => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        logging: false,
        dialectOptions: databaseTlsOptions({
          APP_ENV: configService.get('APP_ENV'),
          DB_DATABASE: configService.get('DB_DATABASE'),
          DB_USERNAME: configService.get('DB_USERNAME'),
          DB_TLS: configService.get('DB_TLS'),
          DB_TLS_REJECT_UNAUTHORIZED: configService.get('DB_TLS_REJECT_UNAUTHORIZED'),
          DB_TLS_CA: configService.get('DB_TLS_CA'),
        }),
      });
      sequelize.addModels([
        User,
        Customer,
        CustomerSeller,
        CustomerPaymentCondition,
        CustomerPaymentMethod,
        PriceTable,
        PriceTableItem,
        PriceTableRule,
        PaymentMethod,
        PaymentCondition,
        SubCategory,
        Category,
        Product,
        ProductPhoto,
        ProductSubCategory,
        Order,
        OrderItem,
        OrderResponsibleUser,
        Company,
        StockMovement,
        Segment,
        SubSegment,
        AccessRequest,
        UserHierarchy,
        OrderSetup,
        UserGoal,
        UserGoalProduct,
        Route,
        Trip,
        VisitRecord,
        ScheduledVisit,
        City,
        UserCompany,
      ]);
      await sequelize.sync({ alter: true });

      // Enable unaccent extension for accent-insensitive text searches
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS unaccent');

      await createFullTextIndexes(sequelize);

      await migrateUserCompanies(User);

      return sequelize;
    },
    inject: [ConfigService],
  },
];
