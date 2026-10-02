import { Injectable } from '@nestjs/common';
import { CreatePaymentMethodDto } from './dtos/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dtos/update-payment-method.dto';
import { PaymentMethod } from './payment-method.entity';

@Injectable()
export class PaymentMethodsMapper {
  constructor() {}

  async createPaymentMethodDtoToPaymentMethod(
    createPaymentMethodDto: CreatePaymentMethodDto,
    companyId: number,
  ): Promise<PaymentMethod> {
    const paymentMethod = new PaymentMethod();
    paymentMethod.name = createPaymentMethodDto.name;
    paymentMethod.description = createPaymentMethodDto.description;
    paymentMethod.companyId = companyId;

    return paymentMethod;
  }

  async updatePaymentMethodDtoToPaymentMethod(
    currentPaymentMethod: PaymentMethod,
    updatePaymentMethodDto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    if (updatePaymentMethodDto.name)
      currentPaymentMethod.name = updatePaymentMethodDto.name;

    if (updatePaymentMethodDto.description)
      currentPaymentMethod.description = updatePaymentMethodDto.description;

    return currentPaymentMethod;
  }
}
