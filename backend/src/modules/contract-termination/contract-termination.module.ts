import { Module } from '@nestjs/common';
import { ContractTerminationService } from './contract-termination.service';
import { ContractTerminationController } from './contract-termination.controller';

@Module({
  providers: [ContractTerminationService],
  controllers: [ContractTerminationController],
  exports: [ContractTerminationService],
})
export class ContractTerminationModule {}
