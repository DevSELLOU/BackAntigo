import { Injectable } from '@nestjs/common';
import { AuthAccessRequestDto } from 'src/auth/dtos/auth-access-request.dto';
import { AccessRequest } from './access-request.entity';

@Injectable()
export class AccessRequestsMapper {
  constructor() {}

  async createAccessRequestDtoToAccessRequest(
    authAccessRequestDto: AuthAccessRequestDto,
    companyId: number,
    customerId?: number,
  ): Promise<AccessRequest> {
    const accessRequest = new AccessRequest();
    accessRequest.companyId = companyId;
    if (customerId) accessRequest.customerId = customerId;
    Object.assign(accessRequest, authAccessRequestDto);
    return accessRequest;
  }
}
