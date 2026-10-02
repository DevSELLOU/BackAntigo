import { Injectable } from '@nestjs/common';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';

@Injectable()
export class CustomersMapper {
  constructor() {}

  async createCustomerDtoToCustomer(
    createCustomerDto: CreateCustomerDto,
    companyId: number,
  ): Promise<Customer> {
    const customer = new Customer();
    customer.companyId = companyId;
    Object.assign(customer, createCustomerDto);
    return customer;
  }

  async updateCustomerDtoToCustomer(
    currentCustomer: Customer,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    Object.entries(updateCustomerDto).forEach(([key, value]) => {
      if (value !== undefined) {
        (currentCustomer as any)[key] = value;
      }
    });
    return currentCustomer;
  }
}
