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

  @Get() findAll(@Query() query: QueryServiceBreakDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Roles('ADMIN')
  @Post() create(@Body() dto: CreateServiceBreakDto) { return this.service.create(dto); }

  @Roles('ADMIN')
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateServiceBreakDto) { return this.service.update(id, dto); }

  @Roles('ADMIN')
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
