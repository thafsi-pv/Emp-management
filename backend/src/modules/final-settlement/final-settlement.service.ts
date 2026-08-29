import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFinalSettlementDto, UpdateClearanceDto } from './dto/final-settlement.dto';

@Injectable()
export class FinalSettlementService {
  constructor(private prisma: PrismaService) {}

  async findByEmployee(employeeId: string) {
    return this.prisma.finalSettlement.findUnique({
      where: { employeeId },
      include: { employee: true },
    });
  }

  async calculateAndCreate(dto: CreateFinalSettlementDto) {
    const existing = await this.prisma.finalSettlement.findUnique({
      where: { employeeId: dto.employeeId },
    });
    if (existing) throw new ConflictException('Final settlement already initiated for this employee');

    const pendingSalary = dto.pendingSalary || 0;
    const leaveAdjustments = dto.leaveAdjustments || 0;
    const otPay = dto.otPay || 0;
    const advanceDeductions = dto.advanceDeductions || 0;
    const otherAdjustments = dto.otherAdjustments || 0;

    const netPayable = pendingSalary + leaveAdjustments + otPay - advanceDeductions + otherAdjustments;

    return this.prisma.finalSettlement.create({
      data: {
        employeeId: dto.employeeId,
        lastWorkingDate: new Date(dto.lastWorkingDate),
        pendingSalary,
        leaveAdjustments,
        otPay,
        advanceDeductions,
        otherAdjustments,
        netPayable,
      },
      include: { employee: true },
    });
  }

  async updateClearance(employeeId: string, dto: UpdateClearanceDto) {
    const fs = await this.findByEmployee(employeeId);
    if (!fs) throw new NotFoundException('Final settlement not found for this employee');

    const updated = await this.prisma.finalSettlement.update({
      where: { employeeId },
      data: dto,
      include: { employee: true },
    });

    // If all clearances completed, automatically set status to RESIGNED / TERMINATED if needed
    if (updated.departmentClearance && updated.financeClearance && updated.hrClearance) {
      await this.prisma.employee.update({
        where: { id: employeeId },
        data: { status: 'RESIGNED' },
      });
    }

    return updated;
  }
}
