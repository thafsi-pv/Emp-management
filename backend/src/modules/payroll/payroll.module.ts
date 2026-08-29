import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PayrollPdfService } from './payroll-pdf.service';

@Module({
  providers: [PayrollService, PayrollPdfService],
  controllers: [PayrollController],
  exports: [PayrollService],
})
export class PayrollModule {}
