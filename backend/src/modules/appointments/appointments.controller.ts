import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AppointmentsService } from './appointments.service';
import { AppointmentPdfService } from './appointment-pdf.service';
import { CreateAppointmentDto, UpdateAppointmentDto, QueryAppointmentDto } from './dto/appointment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private service: AppointmentsService,
    private pdfService: AppointmentPdfService,
  ) {}

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT')
  @Get()
  findAll(@Query() query: QueryAppointmentDto) { return this.service.findAll(query); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'MANAGEMENT')
  @Get('expiring')
  getExpiring(@Query('days') days: string) {
    return this.service.getExpiring(parseInt(days) || 30);
  }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT')
  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT')
  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const appt = await this.service.findOne(id);
    this.pdfService.generateAppointmentPdf(appt, res);
  }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Post()
  create(@Body() dto: CreateAppointmentDto) { return this.service.create(dto); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.service.update(id, dto);
  }
}
