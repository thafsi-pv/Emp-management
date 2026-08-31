import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ContractTerminationService } from './contract-termination.service';
import { CreateContractTerminationDto, QueryContractTerminationDto } from './dto/contract-termination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contract-terminations')
export class ContractTerminationController {
  constructor(private service: ContractTerminationService) {}

  @Get() findAll(@Query() query: QueryContractTerminationDto) { return this.service.findAll(query); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Post() create(@Body() dto: CreateContractTerminationDto) { return this.service.create(dto); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Post('resignation')
  createResignation(@Body() dto: CreateContractTerminationDto) { return this.service.createResignation(dto); }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER')
  @Patch(':employeeId/clearance')
  updateClearance(@Param('employeeId') employeeId: string, @Body() dto: { clearanceDone?: boolean; idCardReturned?: boolean; propertyReturned?: boolean }) { return this.service.updateClearance(employeeId, dto); }
}
