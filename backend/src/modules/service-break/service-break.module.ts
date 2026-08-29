import { Module } from '@nestjs/common';
import { ServiceBreakService } from './service-break.service';
import { ServiceBreakController } from './service-break.controller';

@Module({
  providers: [ServiceBreakService],
  controllers: [ServiceBreakController],
  exports: [ServiceBreakService],
})
export class ServiceBreakModule {}
