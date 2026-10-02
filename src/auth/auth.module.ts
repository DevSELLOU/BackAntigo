import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { EmailsModule } from 'src/emails/emails.module';
import { AccessRequestsModule } from 'src/presentation/access-requests/access-requests.module';
import { UserCompaniesModule } from 'src/user-companies/user-companies.module';
import { UsersModule } from 'src/users/users.module';
import { EnvironmentVariables } from '../env.validation';
import { usersProviders } from '../users/users.providers';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (
        configService: ConfigService<EnvironmentVariables, true>,
      ) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
        global: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    UserCompaniesModule,
    EmailsModule,
    AccessRequestsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ...usersProviders,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [JwtModule],
})
export class AuthModule {}
