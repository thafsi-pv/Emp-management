import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary') summary() { return this.dashboard.summary(); }
  @Get('strength') strength() { return this.dashboard.strength(); }
  @Get('attendance-today') attendanceToday() { return this.dashboard.attendanceToday(); }
  @Get('pending') pending() { return this.dashboard.pending(); }
}
