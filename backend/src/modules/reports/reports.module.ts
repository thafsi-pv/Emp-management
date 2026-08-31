import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportPdfService } from './report-pdf.service';

@Module({
  providers: [ReportsService, ReportPdfService],
  controllers: [ReportsController],
})
export class ReportsModule {}
