import { UserRole } from '../../users/enums/user-role.enum';
import { UserStatus } from '../../users/enums/user-status.enum';
import { Expose } from 'class-transformer';

export class UserCompanyResponseDto {
  @Expose()
  readonly userCompanyId: number;

  @Expose()
  readonly companyId: number;

  @Expose()
  readonly companyName: string;

  @Expose()
  readonly fantasyName: string;

  @Expose()
  readonly role: UserRole;

  @Expose()
  readonly logoUrl?: string;
}

export class UserLoginResponseDto {
  @Expose()
  readonly id: number;

  @Expose()
  readonly name: string;

  @Expose()
  readonly email: string;

  @Expose()
  readonly role: UserRole;

  @Expose()
  readonly status: UserStatus;

  @Expose()
  readonly createdAt: Date;

  @Expose()
  readonly companyId: number;

  @Expose()
  readonly activeCompanyId: number;

  @Expose()
  readonly companies: UserCompanyResponseDto[];

  @Expose()
  readonly position?: string;

  @Expose()
  readonly phoneNumber?: string;

  @Expose()
  readonly profilePhoto?: string;
}
