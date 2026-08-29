import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ContractRenewalService } from './contract-renewal.service';
import { CreateContractRenewalDto, QueryContractRenewalDto } from './dto/contract-renewal.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contract-renewals')
export class ContractRenewalController {
  constructor(private service: ContractRenewalService) {}

  @Get() findAll(@Query() query: QueryContractRenewalDto) { return this.service.findAll(query); }

  @Roles('ADMIN')
  @Post() create(@Body() dto: CreateContractRenewalDto) { return this.service.create(dto); }
}
