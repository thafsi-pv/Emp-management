import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ReportPdfService } from './report-pdf.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService, private pdfService: ReportPdfService) {}

  @Get('dashboard')
  getDashboardStats() { return this.service.getDashboardStats(); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT')
  @Get('catalog')
  catalog() { return this.service.catalog(); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT')
  @Get('catalog/:type')
  catalogReport(
    @Param('type') type: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('departmentId') departmentId?: string,
  ) { return this.service.getCatalogReport(type, { month, year: year ? Number(year) : undefined, departmentId }); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT')
  @Get('catalog/:type/pdf')
  async catalogPdf(@Param('type') type: string, @Query('month') month: string | undefined, @Query('year') year: string | undefined, @Query('departmentId') departmentId: string | undefined, @Res() res: Response) {
    const report = await this.service.getCatalogReport(type, { month, year: year ? Number(year) : undefined, departmentId });
    return this.pdfService.generate(type, report, res);
  }

  @Roles('ADMIN')
  @Get('establishment')
  getEstablishmentRegister(@Query('departmentId') departmentId?: string) {
    return this.service.getEstablishmentRegister(departmentId);
  }

  @Roles('ADMIN')
  @Get('service-break')
  getServiceBreakAudit() {
    return this.service.getServiceBreakAudit();
  }

  @Roles('ADMIN')
  @Get('pay-structure')
  getPayStructureMatrix(@Query('departmentId') departmentId?: string) {
    return this.service.getPayStructureMatrix(departmentId);
  }

  @Roles('ADMIN')
  @Get('employees')
  getEmployeeReport(
    @Query('departmentId') departmentId?: string,
    @Query('designationId') designationId?: string,
    @Query('status') status?: string,
  ) { return this.service.getEmployeeReport({ departmentId, designationId, status }); }

  @Roles('ADMIN')
  @Get('attendance')
  getAttendanceReport(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('employeeId') employeeId?: string,
  ) { return this.service.getAttendanceReport({ month, year: year ? parseInt(year) : undefined, employeeId }); }

  @Roles('ADMIN')
  @Get('payroll')
  getPayrollReport(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('departmentId') departmentId?: string,
  ) { return this.service.getPayrollReport({ month, year: year ? parseInt(year) : undefined, departmentId }); }

  @Roles('ADMIN')
  @Get('contracts')
  getContractReport(@Query('status') status?: string) {
    return this.service.getContractReport({ status });
  }
}
