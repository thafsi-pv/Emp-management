import { Controller, Get, Patch, Param, Post, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  findAll(@CurrentUser() user: { role: string; employeeId?: string }) {
    return this.alerts.findAll(user.role, user.employeeId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.alerts.markRead(id);
  }

  @Roles('ADMIN')
  @Post('refresh')
  refresh() {
    return this.alerts.refresh();
  }
}
