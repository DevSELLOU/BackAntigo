import { DataType, Model, Sequelize } from 'sequelize-typescript';
import { UserGoal } from './entities/user-goal.entity';
import { UserGoalProduct } from './entities/user-goal-product.entity';

export const userGoalsProviders = [
  {
    provide: 'USER_GOAL_REPOSITORY',
    useValue: UserGoal,
  },
  {
    provide: 'USER_GOAL_PRODUCT_REPOSITORY',
    useValue: UserGoalProduct,
  },
];
