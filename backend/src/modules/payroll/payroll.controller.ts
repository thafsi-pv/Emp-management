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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PayrollRunPdfService } from './payroll-run-pdf.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(
    private service: PayrollService,
    private pdfService: PayrollPdfService,
    private runPdfService: PayrollRunPdfService,
  ) {}

  @Roles('ADMIN', 'PAYROLL_OFFICER', 'ESTABLISHMENT_OFFICER', 'MANAGEMENT')
  @Get()
  findAll(@Query() query: QueryPayrollDto) { return this.service.findAll(query); }

  @Roles('ADMIN', 'PAYROLL_OFFICER', 'ESTABLISHMENT_OFFICER', 'MANAGEMENT')
  @Get('summary')
  getMonthlySummary(@Query('month') month: string, @Query('year') year: string) {
    return this.service.getMonthlySummary(month, parseInt(year));
  }

  @Roles('ADMIN', 'PAYROLL_OFFICER', 'MANAGEMENT')
  @Get('runs')
  findRuns() { return this.service.findRuns(); }

  @Roles('ADMIN', 'PAYROLL_OFFICER')
  @Post('runs')
  createRun(@Body() body: { month: number; year: number }) { return this.service.createRun(Number(body.month), Number(body.year)); }

  @Roles('ADMIN', 'PAYROLL_OFFICER')
  @Post('runs/:id/generate')
  generateRun(@Param('id') id: string) { return this.service.generateRun(id); }

  @Roles('ADMIN', 'PAYROLL_OFFICER', 'MANAGEMENT')
  @Get('runs/:id/register.pdf')
  async runRegister(@Param('id') id: string, @Res() res: Response) { this.runPdfService.register(await this.service.findRun(id), res); }

  @Roles('ADMIN', 'PAYROLL_OFFICER', 'MANAGEMENT')
  @Get('runs/:id/bank-statement.pdf')
  async bankStatement(@Param('id') id: string, @Res() res: Response) { this.runPdfService.bankStatement(await this.service.findRun(id), res); }

  @Roles('ADMIN', 'PAYROLL_OFFICER', 'ESTABLISHMENT_OFFICER', 'MANAGEMENT', 'EMPLOYEE')
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) { return this.service.findOneForUser(id, user); }

  @Roles('ADMIN', 'PAYROLL_OFFICER', 'ESTABLISHMENT_OFFICER', 'MANAGEMENT', 'EMPLOYEE')
  @Get(':id/payslip')
  async downloadPayslip(@Param('id') id: string, @CurrentUser() user: any, @Res() res: Response) {
    const payroll = await this.service.findOneForUser(id, user);
    this.pdfService.generatePayslip(payroll, res);
  }

  @Roles('ADMIN', 'PAYROLL_OFFICER')
  @Post('generate')
  generate(@Body() dto: GeneratePayrollDto) { return this.service.generate(dto); }

  @Roles('ADMIN', 'PAYROLL_OFFICER')
  @Patch(':id/approve')
  approve(@Param('id') id: string) { return this.service.approve(id); }

  @Roles('ADMIN', 'PAYROLL_OFFICER')
  @Patch(':id/paid')
  markPaid(@Param('id') id: string) { return this.service.markPaid(id); }
}
