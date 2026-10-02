import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseProviders } from '../database.providers';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { CrmModule } from './crm/crm.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmailsModule } from './emails/emails.module';
import { validate } from './env.validation';
import { AccessRequestsModule } from './presentation/access-requests/access-requests.module';
import { CategoriesModule } from './presentation/categories/categories.module';
import { CustomersClientsModule } from './presentation/customers-clients/customers-clients.module';
import { CustomersModule } from './presentation/customers/customers.module';
import { OrderSetupsModule } from './presentation/order-setups/order-setups.module';
import { OrderSetupsProviders } from './presentation/order-setups/order-setups.providers';
import { OrdersModule } from './presentation/orders/orders.module';
import { OrdersProviders } from './presentation/orders/orders.providers';
import { PaymentConditionsModule } from './presentation/payment-conditions/payment-conditions.module';
import { PaymentMethodsModule } from './presentation/payment-methods/payment-methods.module';
import { PriceTablesModule } from './presentation/price-tables/price-tables.module';
import { PriceTablesProviders } from './presentation/price-tables/price-tables.providers';
import { ProductsModule } from './presentation/products/products.module';
import { ProductsProviders } from './presentation/products/products.providers';
import { SegmentsModule } from './presentation/segments/segments.module';
import { StockMovementModule } from './presentation/stock-movement/stock-movement.module';
import { SubCategoryModule } from './presentation/sub-categories/sub-categories.module';
import { SubSegmentsModule } from './presentation/sub-segments/sub-segments.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';
import { ReportsdModule } from './reports/reports';
import { UserHierarchiesModule } from './user-hierarchies/user-hierarchies.module';
import { UserHierarchiesProviders } from './user-hierarchies/user-hierarchies.providers';
import { UserGoalsModule } from './user-goals/user-goals.module';
import { userGoalsProviders } from './user-goals/user-goals.providers';
import { UserCompaniesModule } from './user-companies/user-companies.module';
import { PricingModule } from './presentation/pricing/pricing.module';
import { RoutesVisitsModule } from './routes-visits/routes-visits.module';
import { CitiesModule } from './cities/cities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    AccessRequestsModule,
    AuthModule,
    CategoriesModule,
    CompaniesModule,
    ConfigurationModule,
    CrmModule,
    CustomersClientsModule,
    CustomersModule,
    DashboardModule,
    EmailsModule,
    OrdersModule,
    OrderSetupsModule,
    PaymentConditionsModule,
    PaymentMethodsModule,
    PriceTablesModule,
    ProductsModule,
    ReportsdModule,
    SegmentsModule,
    SubCategoryModule,
    SubSegmentsModule,
    StockMovementModule,
    UploadsModule,
    UserHierarchiesModule,
    UsersModule,
    UserGoalsModule,
    UserCompaniesModule,
    PricingModule,
    RoutesVisitsModule,
    CitiesModule,
  ],
  controllers: [AppController],
  providers: [
    ...databaseProviders,
    ...OrdersProviders,
    ...OrderSetupsProviders,
    ...PriceTablesProviders,
    ...ProductsProviders,
    ...UserHierarchiesProviders,
    ...userGoalsProviders,
  ],
  exports: [...databaseProviders],
})
export class AppModule {}
