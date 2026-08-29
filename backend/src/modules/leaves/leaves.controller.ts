import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto, RejectLeaveDto } from './dto/leave.dto';

@Controller('leaves')
export class LeavesController {
  constructor(private readonly service: LeavesService) {}

  @Get()
  findAll(@Query('employeeId') employeeId?: string, @Query('status') status?: string) {
    return this.service.findAll(employeeId, status);
  }

  @Post()
  create(@Body() dto: CreateLeaveDto) {
    return this.service.create(dto);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectLeaveDto) {
    return this.service.reject(id, dto);
  }
}
