import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { FinalSettlementService } from './final-settlement.service';
import { CreateFinalSettlementDto, UpdateClearanceDto } from './dto/final-settlement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('final-settlements')
export class FinalSettlementController {
  constructor(private readonly service: FinalSettlementService) {}

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER')
  @Get(':employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.service.findByEmployee(employeeId);
  }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER')
  @Post()
  calculateAndCreate(@Body() dto: CreateFinalSettlementDto) {
    return this.service.calculateAndCreate(dto);
  }

  @Roles('ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER')
  @Patch(':employeeId/clearance')
  updateClearance(@Param('employeeId') employeeId: string, @Body() dto: UpdateClearanceDto) {
    return this.service.updateClearance(employeeId, dto);
  }
}
