import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { ProductsModule } from 'src/presentation/products/products.module';
import { UsersModule } from 'src/users/users.module';
import { UserGoalsController } from './user-goals.controller';
import { UserGoalsMapper } from './user-goals.mapper';
import { userGoalsProviders } from './user-goals.providers';
import { UserGoalsService } from './user-goals.service';

@Module({
  imports: [CompaniesModule, UsersModule, ProductsModule],
  providers: [UserGoalsService, UserGoalsMapper, ...userGoalsProviders],
  controllers: [UserGoalsController],
  exports: [UserGoalsService],
})
export class UserGoalsModule {}
