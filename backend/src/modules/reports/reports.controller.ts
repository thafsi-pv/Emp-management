import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('dashboard')
  getDashboardStats() { return this.service.getDashboardStats(); }

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
