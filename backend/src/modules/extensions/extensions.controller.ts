import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ExtensionsService } from './extensions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('extensions')
export class ExtensionsController {
  constructor(private readonly extensions: ExtensionsService) {}
  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'MANAGEMENT')
  @Get() findAll(@Query('employeeId') employeeId?: string) { return this.extensions.findAll(employeeId); }
  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Post() create(@Body() dto: { employeeId: string; previousAppointmentId: string; orderNumber?: string; orderDate?: string; startDate: string; endDate?: string; periodDays?: number; reason?: string }) { return this.extensions.create(dto); }
}
