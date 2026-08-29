import { Module } from '@nestjs/common';
import { PayStructuresService } from './pay-structures.service';
import { PayStructuresController } from './pay-structures.controller';

@Module({
  controllers: [PayStructuresController],
  providers: [PayStructuresService],
  exports: [PayStructuresService],
})
export class PayStructuresModule {}
