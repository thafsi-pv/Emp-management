import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ServiceBreakService } from './service-break.service';
import { CreateServiceBreakDto, UpdateServiceBreakDto, QueryServiceBreakDto } from './dto/service-break.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('service-breaks')
export class ServiceBreakController {
  constructor(private service: ServiceBreakService) {}

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'MANAGEMENT')
  @Get('due') dueList() { return this.service.dueList(); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'MANAGEMENT')
  @Get('active') activeList() { return this.service.activeList(); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT')
  @Get() findAll(@Query() query: QueryServiceBreakDto) { return this.service.findAll(query); }
  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT')
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Post() create(@Body() dto: CreateServiceBreakDto) { return this.service.create(dto); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Post('appointment/:appointmentId/start')
  start(@Param('appointmentId') appointmentId: string, @Body() dto: CreateServiceBreakDto) { return this.service.startForAppointment(appointmentId, dto); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Patch(':id/complete')
  complete(@Param('id') id: string) { return this.service.complete(id); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateServiceBreakDto) { return this.service.update(id, dto); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
