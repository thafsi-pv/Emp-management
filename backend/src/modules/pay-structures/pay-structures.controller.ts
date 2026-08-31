import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PayStructuresService } from './pay-structures.service';
import { CreatePayStructureDto, CreatePayRevisionDto } from './dto/pay-structure.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pay-structures')
export class PayStructuresController {
  constructor(private readonly service: PayStructuresService) {}

  @Roles('ADMIN', 'PAYROLL_OFFICER', 'ESTABLISHMENT_OFFICER')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles('ADMIN', 'PAYROLL_OFFICER', 'ESTABLISHMENT_OFFICER')
  @Get('designation/:designationId')
  findByDesignation(@Param('designationId') designationId: string) {
    return this.service.findByDesignation(designationId);
  }

  @Roles('ADMIN', 'PAYROLL_OFFICER')
  @Post()
  create(@Body() dto: CreatePayStructureDto) {
    return this.service.create(dto);
  }

  @Roles('ADMIN', 'PAYROLL_OFFICER')
  @Post('revisions')
  recordRevision(@Body() dto: CreatePayRevisionDto) {
    return this.service.recordRevision(dto);
  }

  @Roles('ADMIN', 'PAYROLL_OFFICER', 'ESTABLISHMENT_OFFICER')
  @Get('revisions/:employeeId')
  getRevisions(@Param('employeeId') employeeId: string) {
    return this.service.getRevisions(employeeId);
  }
}
