import { Module } from '@nestjs/common';
import { CompaniesModule } from 'src/companies/companies.module';
import { UsersModule } from 'src/users/users.module';
import { UserHierarchiesController } from './user-hierarchies.controller';
import { UserHierarchiesService } from './user-hierarchies.service';
import { UserHierarchiesProviders } from './user-hierarchies.providers';
import { UserHierarchy } from './user-hierarchy.entity';

@Module({
  imports: [CompaniesModule, UsersModule],
  controllers: [UserHierarchiesController],
  providers: [UserHierarchiesService, ...UserHierarchiesProviders],
  exports: [UserHierarchiesService],
})
export class UserHierarchiesModule {}
