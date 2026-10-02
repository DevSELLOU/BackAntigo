import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserStatusDto } from './dtos/update-user-status.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';
import { User } from './user.entity';
import { getUserRoleText } from 'src/utils/user-role-text.util';

@Injectable()
export class UsersMapper {
  constructor() {}

  async createUserDtoToUser(
    createUserDto: CreateUserDto,
    password: string,
    companyId?: number,
    customerId?: number,
  ): Promise<User> {
    const role =
      createUserDto.role ||
      (customerId
        ? UserRole.CustomerClient
        : companyId
        ? UserRole.CompanyAdministrator
        : UserRole.Administrator);
    const position = getUserRoleText(role);
    const user = new User();
    user.name = createUserDto.name;
    user.position = createUserDto.position;
    user.email = createUserDto.email;
    user.password = password;
    user.position = position;
    user.role = role;
    user.status = UserStatus.Onboarding;

    if (companyId) user.companyId = companyId;

    if (customerId) user.customerId = customerId;

    return user;
  }

  async updateUserDtoToUser(
    currentUser: User,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    if (updateUserDto.name) currentUser.name = updateUserDto.name;
    if (updateUserDto.position) currentUser.position = updateUserDto.position;
    if (updateUserDto.phoneNumber)
      currentUser.phoneNumber = updateUserDto.phoneNumber;
    if (updateUserDto.profilePhoto)
      currentUser.profilePhoto = updateUserDto.profilePhoto;
    if (updateUserDto.role) currentUser.role = updateUserDto.role;
    if (updateUserDto.status) currentUser.status = updateUserDto.status;

    return currentUser;
  }

  async updateUserStatusDtoToStatus(
    currentUser: User,
    updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<User> {
    currentUser.status = updateUserStatusDto.status;

    return currentUser;
  }
}
