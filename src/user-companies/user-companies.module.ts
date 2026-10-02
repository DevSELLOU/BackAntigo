import { Module } from '@nestjs/common';
import { EmailsModule } from '../emails/emails.module';
import { UserCompaniesController } from './user-companies.controller';
import { UserCompaniesService } from './user-companies.service';
import { userCompaniesProviders } from './user-companies.providers';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [EmailsModule, UsersModule],
  controllers: [UserCompaniesController],
  providers: [UserCompaniesService, ...userCompaniesProviders],
  exports: [UserCompaniesService],
})
export class UserCompaniesModule {}
