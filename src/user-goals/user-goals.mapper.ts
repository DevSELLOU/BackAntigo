import { Injectable } from '@nestjs/common';
import { CreateUserGoalDto } from './dtos/create-user-goal.dto';
import { UpdateUserGoalDto } from './dtos/update-user-goal.dto';
import { UserGoal } from './entities/user-goal.entity';
import { UserGoalType } from './enums/user-goal-type.enum';

@Injectable()
export class UserGoalsMapper {
  async createUserGoalDtoToUserGoal(
    createUserGoalDto: CreateUserGoalDto,
    companyId: number,
  ): Promise<UserGoal> {
    const userGoal = new UserGoal();
    userGoal.type = createUserGoalDto.type as UserGoalType;
    userGoal.targetValue = createUserGoalDto.targetValue;
    userGoal.startDate = createUserGoalDto.startDate;
    userGoal.endDate = createUserGoalDto.endDate;
    userGoal.userId = createUserGoalDto.userId;
    userGoal.companyId = companyId;
    userGoal.currentValue = 0;

    return userGoal;
  }

  async updateUserGoalDtoToUserGoal(
    currentUserGoal: UserGoal,
    updateUserGoalDto: UpdateUserGoalDto,
  ): Promise<UserGoal> {
    if (updateUserGoalDto.targetValue !== undefined) {
      currentUserGoal.targetValue = updateUserGoalDto.targetValue;
    }

    return currentUserGoal;
  }
}
