import { Module } from '@nestjs/common';
import { ContractRenewalService } from './contract-renewal.service';
import { ContractRenewalController } from './contract-renewal.controller';

@Module({
  providers: [ContractRenewalService],
  controllers: [ContractRenewalController],
  exports: [ContractRenewalService],
})
export class ContractRenewalModule {}
