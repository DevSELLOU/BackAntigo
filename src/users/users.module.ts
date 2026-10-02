import { Module } from '@nestjs/common';
import { ExportsModule } from 'src/exports/exports.module';
import { EmailsModule } from '../emails/emails.module';
import { UsersController } from './users.controller';
import { UsersMapper } from './users.mapper';
import { usersProviders } from './users.providers';
import { UsersService } from './users.service';

@Module({
  imports: [EmailsModule, ExportsModule],
  providers: [UsersService, UsersMapper, ...usersProviders],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
