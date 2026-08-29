import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PayrollService } from './payroll.service';
import { PayrollPdfService } from './payroll-pdf.service';
import { GeneratePayrollDto, QueryPayrollDto } from './dto/payroll.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(
    private service: PayrollService,
    private pdfService: PayrollPdfService,
  ) {}

  @Get()
  findAll(@Query() query: QueryPayrollDto) { return this.service.findAll(query); }

  @Get('summary')
  getMonthlySummary(@Query('month') month: string, @Query('year') year: string) {
    return this.service.getMonthlySummary(month, parseInt(year));
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Get(':id/payslip')
  async downloadPayslip(@Param('id') id: string, @Res() res: Response) {
    const payroll = await this.service.findOne(id);
    this.pdfService.generatePayslip(payroll, res);
  }

  @Roles('ADMIN')
  @Post('generate')
  generate(@Body() dto: GeneratePayrollDto) { return this.service.generate(dto); }

  @Roles('ADMIN')
  @Patch(':id/approve')
  approve(@Param('id') id: string) { return this.service.approve(id); }

  @Roles('ADMIN')
  @Patch(':id/paid')
  markPaid(@Param('id') id: string) { return this.service.markPaid(id); }
}
