import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractTerminationDto, QueryContractTerminationDto } from './dto/contract-termination.dto';
import { paginate } from '../../common/dto/pagination.dto';

const INCLUDE = {
  employee: {
    select: {
      id: true, name: true, code: true,
      department: { select: { id: true, name: true } },
      designation: { select: { id: true, name: true } },
      separation: true,
    },
  },
};

@Injectable()
export class ContractTerminationService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryContractTerminationDto) {
    const { employeeId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const [data, total] = await Promise.all([
      this.prisma.contractTermination.findMany({
        where, include: INCLUDE, skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contractTermination.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async create(dto: CreateContractTerminationDto) {
    return this.createSeparation(dto, 'TERMINATED');
  }

  async createResignation(dto: CreateContractTerminationDto) {
    return this.createSeparation(dto, 'RESIGNED');
  }

  async updateClearance(employeeId: string, dto: { clearanceDone?: boolean; idCardReturned?: boolean; propertyReturned?: boolean }) {
    const separation = await this.prisma.separation.findUnique({ where: { employeeId } });
    if (!separation) throw new NotFoundException('Separation not found');
    const updated = await this.prisma.separation.update({ where: { employeeId }, data: dto });
    return updated;
  }

  private async createSeparation(dto: CreateContractTerminationDto, status: 'TERMINATED' | 'RESIGNED') {
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.separation.upsert({
        where: { employeeId: dto.employeeId },
        update: { type: status === 'TERMINATED' ? 'TERMINATION' : 'RESIGNATION', reason: dto.reason, effectiveDate: new Date(dto.terminationDate) },
        create: { employeeId: dto.employeeId, type: status === 'TERMINATED' ? 'TERMINATION' : 'RESIGNATION', reason: dto.reason, effectiveDate: new Date(dto.terminationDate) },
      });
      const termination = await tx.contractTermination.create({
        data: { ...dto, terminationDate: new Date(dto.terminationDate) }, include: INCLUDE,
      });
      await tx.employee.update({ where: { id: dto.employeeId }, data: { status } });
      await tx.appointment.updateMany({ where: { employeeId: dto.employeeId, status: 'ACTIVE' }, data: { status: 'TERMINATED' } });
      return termination;
    });
  }
}
