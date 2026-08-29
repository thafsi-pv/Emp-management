import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePayStructureDto, CreatePayRevisionDto } from './dto/pay-structure.dto';

@Injectable()
export class PayStructuresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.payStructure.findMany({
      include: { designation: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDesignation(designationId: string) {
    return this.prisma.payStructure.findFirst({
      where: { designationId, isActive: true },
      include: { designation: true },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async create(dto: CreatePayStructureDto) {
    // Deactivate previous active structure for this designation
    await this.prisma.payStructure.updateMany({
      where: { designationId: dto.designationId, isActive: true },
      data: { isActive: false },
    });

    // Sync master designation pay fields
    await this.prisma.designation.update({
      where: { id: dto.designationId },
      data: {
        payType: dto.payType,
        basicPay: dto.basicPay,
        weightage: dto.weightage || 0,
        allowance: dto.allowance || 0,
        otRate: dto.otRate || 0,
      },
    });

    return this.prisma.payStructure.create({
      data: {
        designationId: dto.designationId,
        payType: dto.payType,
        basicPay: dto.basicPay,
        weightage: dto.weightage || 0,
        allowance: dto.allowance || 0,
        otRate: dto.otRate || 0,
        effectiveFrom: new Date(dto.effectiveFrom),
        isActive: true,
      },
      include: { designation: true },
    });
  }

  async recordRevision(dto: CreatePayRevisionDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    // Update employee current salary field
    await this.prisma.employee.update({
      where: { id: dto.employeeId },
      data: { salary: dto.newBasicPay },
    });

    return this.prisma.payRevision.create({
      data: {
        employeeId: dto.employeeId,
        oldBasicPay: dto.oldBasicPay,
        newBasicPay: dto.newBasicPay,
        effectiveDate: new Date(dto.effectiveDate),
        reason: dto.reason,
        orderNumber: dto.orderNumber,
      },
      include: { employee: true },
    });
  }

  async getRevisions(employeeId: string) {
    return this.prisma.payRevision.findMany({
      where: { employeeId },
      orderBy: { effectiveDate: 'desc' },
    });
  }
}
