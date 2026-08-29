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
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const termination = await this.prisma.contractTermination.create({
      data: {
        ...dto,
        terminationDate: new Date(dto.terminationDate),
      },
      include: INCLUDE,
    });

    // Update employee status to TERMINATED
    await this.prisma.employee.update({
      where: { id: dto.employeeId },
      data: { status: 'TERMINATED' },
    });

    // Terminate all active appointments
    await this.prisma.appointment.updateMany({
      where: { employeeId: dto.employeeId, status: 'ACTIVE' },
      data: { status: 'TERMINATED' },
    });

    return termination;
  }
}
