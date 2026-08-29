import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PayStructuresService } from './pay-structures.service';
import { CreatePayStructureDto, CreatePayRevisionDto } from './dto/pay-structure.dto';

@Controller('pay-structures')
export class PayStructuresController {
  constructor(private readonly service: PayStructuresService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('designation/:designationId')
  findByDesignation(@Param('designationId') designationId: string) {
    return this.service.findByDesignation(designationId);
  }

  @Post()
  create(@Body() dto: CreatePayStructureDto) {
    return this.service.create(dto);
  }

  @Post('revisions')
  recordRevision(@Body() dto: CreatePayRevisionDto) {
    return this.service.recordRevision(dto);
  }

  @Get('revisions/:employeeId')
  getRevisions(@Param('employeeId') employeeId: string) {
    return this.service.getRevisions(employeeId);
  }
}
