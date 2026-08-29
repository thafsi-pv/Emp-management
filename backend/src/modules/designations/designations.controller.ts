import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DesignationsService } from './designations.service';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/designation.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('designations')
export class DesignationsController {
  constructor(private service: DesignationsService) {}

  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Roles('ADMIN')
  @Post() create(@Body() dto: CreateDesignationDto) { return this.service.create(dto); }

  @Roles('ADMIN')
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateDesignationDto) { return this.service.update(id, dto); }

  @Roles('ADMIN')
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
