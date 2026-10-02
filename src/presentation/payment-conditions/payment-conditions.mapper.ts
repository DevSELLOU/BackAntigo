import { Injectable } from '@nestjs/common';
import { CreatePaymentConditionDto } from './dtos/create-payment-condition.dto';
import { UpdatePaymentConditionDto } from './dtos/update-payment-condition.dto';
import { PaymentCondition } from './payment-condition.entity';

@Injectable()
export class PaymentConditionsMapper {
  constructor() {}

  async createPaymentConditionDtoToPaymentCondition(
    createPaymentConditionDto: CreatePaymentConditionDto,
    companyId: number,
  ): Promise<PaymentCondition> {
    const paymentCondition = new PaymentCondition();
    paymentCondition.name = createPaymentConditionDto.name;
    paymentCondition.description = createPaymentConditionDto.description;
    paymentCondition.companyId = companyId;

    return paymentCondition;
  }

  async updatePaymentConditionDtoToPaymentCondition(
    currentPaymentCondition: PaymentCondition,
    updatePaymentConditionDto: UpdatePaymentConditionDto,
  ): Promise<PaymentCondition> {
    if (updatePaymentConditionDto.name)
      currentPaymentCondition.name = updatePaymentConditionDto.name;

    if (updatePaymentConditionDto.description)
      currentPaymentCondition.description =
        updatePaymentConditionDto.description;

    return currentPaymentCondition;
  }
}
