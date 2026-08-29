import { Module } from '@nestjs/common';
import { FinalSettlementService } from './final-settlement.service';
import { FinalSettlementController } from './final-settlement.controller';

@Module({
  controllers: [FinalSettlementController],
  providers: [FinalSettlementService],
  exports: [FinalSettlementService],
})
export class FinalSettlementModule {}
