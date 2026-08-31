import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import {
  CreateAttendanceDto, QueryAttendanceDto,
  BulkAttendanceDto, RejectAttendanceDto,
} from './dto/attendance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private service: AttendanceService) {}

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'EMPLOYEE')
  @Get()
  findAll(@Query() query: QueryAttendanceDto, @CurrentUser() user: any) { return this.service.findAll(query, user); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER')
  @Get('daily-summary')
  getDailySummary(@Query('date') date: string) {
    return this.service.getDailySummary(date || new Date().toISOString().slice(0, 10));
  }

  @Roles('ADMIN', 'SUPERVISOR', 'DEPARTMENT_OFFICER')
  @Post()
  create(@Body() dto: CreateAttendanceDto, @CurrentUser() user: any) { return this.service.create(dto, user); }

  @Roles('ADMIN', 'SUPERVISOR', 'DEPARTMENT_OFFICER')
  @Post('bulk')
  bulkCreate(@Body() dto: BulkAttendanceDto, @CurrentUser() user: any) { return this.service.bulkCreate(dto, user); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Post('override')
  override(@Body() dto: CreateAttendanceDto, @CurrentUser() user: any) {
    return this.service.create({ ...dto, override: true }, user);
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.service.approve(id, user.id);
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectAttendanceDto) {
    return this.service.reject(id, dto);
  }
}
