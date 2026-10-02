import { PartialType } from '@nestjs/swagger';
import { CreateOrderSetupDto } from './create-order-setup.dto';

export class UpdateOrderSetupDto extends PartialType(CreateOrderSetupDto) {}
