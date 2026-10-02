import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Order } from '../orders/order.entity';
import { Product } from '../products/entities/product.entity';
import { CreateStockMovementDto } from './dtos/create-stock-movement.dto';
import { StockMovementType } from './enums/stock-movement-type.enum';
import { StockMovement } from './stock-movement.entity';

@Injectable()
export class StockMovementService {
  constructor(
    @Inject('STOCK_MOVEMENT_REPOSITORY')
    private readonly stockMovementRepository: typeof StockMovement,
    @Inject('PRODUCT_REPOSITORY')
    private readonly productRepository: typeof Product,
    @Inject('ORDER_REPOSITORY')
    private readonly orderRepository: typeof Order,
  ) {}

  async createStockMovement(
    createStockMovementDto: CreateStockMovementDto,
  ): Promise<StockMovement> {
    const { productId } = createStockMovementDto;

    const product = await this.productRepository.findByPk(productId);
    if (!product) {
      throw new NotFoundException(`Produto com id ${productId} não encontrado`);
    }

    if (createStockMovementDto.type === StockMovementType.Out) {
      const productStock = product.stock - createStockMovementDto.quantity;
      if (productStock < 0) {
        throw new BadRequestException('Estoque insuficiente');
      }
      product.stock = productStock;
    } else {
      product.stock += createStockMovementDto.quantity;
    }

    await product.save();

    return this.stockMovementRepository.create({ ...createStockMovementDto });
  }

  async findAll(): Promise<StockMovement[]> {
    return this.stockMovementRepository.findAll();
  }

  async findByProduct(productId: number): Promise<StockMovement[]> {
    return this.stockMovementRepository.findAll({
      where: { productId },
    });
  }

  async findByOrder(orderId: number): Promise<StockMovement[]> {
    return this.stockMovementRepository.findAll({
      where: { orderId },
    });
  }

  async deleteStockMovement(id: number): Promise<void> {
    const stockMovement = await this.stockMovementRepository.findByPk(id);
    if (!stockMovement) {
      throw new NotFoundException(
        `Movimentação de estoque com id ${id} não encontrada`,
      );
    }
    await stockMovement.destroy();
  }
}
