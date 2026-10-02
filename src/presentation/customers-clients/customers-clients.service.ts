import { Inject, Injectable } from '@nestjs/common';
import { BaseFindAllDataDto } from 'src/dtos/base-find-all-data.dto';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { OrdersService } from '../orders/orders.service';
import { CreateCustomerClientDto } from './dtos/create-customer-client.dto';
import { UpdateCustomerClientDto } from './dtos/update-customer-client.dto';

@Injectable()
export class CustomersClientsService {
  constructor(
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(OrdersService)
    private readonly ordersService: OrdersService,
  ) {}

  getModel() {
    return this.usersService.getModel();
  }

  async createCustomerClient(
    companyId: number,
    customerId: number,
    createCustomerClientDto: CreateCustomerClientDto,
  ) {
    const createUserDto = new CreateUserDto();
    createUserDto.name = createCustomerClientDto.name;
    createUserDto.email = createCustomerClientDto.email;
    createUserDto.position = 'Cliente Final';

    return await this.usersService.createUser(
      createUserDto,
      companyId,
      customerId,
    );
  }

  async findOne(companyId: number, customerId: number, id: number) {
    return await this.usersService.findOneCustomerClient(
      companyId,
      customerId,
      id,
    );
  }

  async findAll(
    companyId: number,
    customerId: number,
    findAllDto: BaseFindAllDataDto,
  ): Promise<{
    data: User[];
    metadata: { page: number; limit: number; total: number };
  }> {
    return await this.usersService.findCustomerClients(
      companyId,
      customerId,
      findAllDto,
    );
  }

  async updateCustomerClient(
    companyId: number,
    customerId: number,
    id: number,
    updateCustomerClientDto: UpdateCustomerClientDto,
  ) {
    return await this.usersService.updateCustomerClient(
      companyId,
      customerId,
      id,
      updateCustomerClientDto,
    );
  }

  async deleteCustomerClient(
    companyId: number,
    customerId: number,
    id: number,
  ) {
    return await this.usersService.deleteCustomerClient(
      companyId,
      customerId,
      id,
    );
  }

  async findAllOrders(
    companyId: number,
    customerId: number,
    id: number,
    findAllDto: BaseFindAllDataDto,
  ) {
    return await this.ordersService.findCustomerClientOrders(
      companyId,
      customerId,
      id,
      findAllDto,
    );
  }
}
