import { PartialType } from '@nestjs/swagger';
import { CreatePaymentConditionDto } from './create-payment-condition.dto';

export class UpdatePaymentConditionDto extends PartialType(
  CreatePaymentConditionDto,
) {}
