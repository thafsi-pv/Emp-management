import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { FinalSettlementService } from './final-settlement.service';
import { CreateFinalSettlementDto, UpdateClearanceDto } from './dto/final-settlement.dto';

@Controller('final-settlements')
export class FinalSettlementController {
  constructor(private readonly service: FinalSettlementService) {}

  @Get(':employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.service.findByEmployee(employeeId);
  }

  @Post()
  calculateAndCreate(@Body() dto: CreateFinalSettlementDto) {
    return this.service.calculateAndCreate(dto);
  }

  @Patch(':employeeId/clearance')
  updateClearance(@Param('employeeId') employeeId: string, @Body() dto: UpdateClearanceDto) {
    return this.service.updateClearance(employeeId, dto);
  }
}
