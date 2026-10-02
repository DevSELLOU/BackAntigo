import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '../products/entities/product.entity';
import { User } from '../../users/user.entity';

@Injectable()
export class CommissionService {
  constructor(
    @Inject('PRODUCT_REPOSITORY')
    private productsRepository: typeof Product,
    @Inject('USER_REPOSITORY')
    private usersRepository: typeof User,
  ) {}

  async getApplicableCommission(
    productId: number,
    userId: number,
  ): Promise<number> {
    const product = await this.productsRepository.findByPk(productId);
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const commissionPercentage = (product as any).commissionPercentage;
    if (commissionPercentage && commissionPercentage > 0) {
      return Number(commissionPercentage);
    }

    const user = await this.usersRepository.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return Number((user as any).standardCommissionPercentage) || 0;
  }

  async calculateCommission(
    productId: number,
    userId: number,
    finalPrice: number,
  ): Promise<number> {
    const commissionPercentage = await this.getApplicableCommission(
      productId,
      userId,
    );

    return finalPrice * (commissionPercentage / 100);
  }
}
