import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractRenewalDto, QueryContractRenewalDto } from './dto/contract-renewal.dto';
import { paginate } from '../../common/dto/pagination.dto';

const INCLUDE = {
  appointment: {
    include: {
      employee: { select: { id: true, name: true, code: true } },
      department: { select: { id: true, name: true } },
      designation: { select: { id: true, name: true } },
    },
  },
};

@Injectable()
export class ContractRenewalService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryContractRenewalDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.contractRenewal.findMany({
        include: INCLUDE, skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contractRenewal.count(),
    ]);
    return paginate(data, total, page, limit);
  }

  async create(dto: CreateContractRenewalDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    // Create renewal record
    const renewal = await this.prisma.contractRenewal.create({
      data: {
        appointmentId: dto.appointmentId,
        newStartDate: new Date(dto.newStartDate),
        newEndDate: new Date(dto.newEndDate),
        contractType: dto.contractType as any,
        salary: dto.salary,
      },
      include: INCLUDE,
    });

    // Update the original appointment status to RENEWED and create a new active one
    await this.prisma.appointment.update({
      where: { id: dto.appointmentId },
      data: { status: 'RENEWED' },
    });

    // Generate new appointment order number
    const year = new Date().getFullYear();
    const count = await this.prisma.appointment.count({
      where: { orderNumber: { startsWith: `APT-${year}-` } },
    });
    const orderNumber = `APT-${year}-${String(count + 1).padStart(3, '0')}`;

    await this.prisma.appointment.create({
      data: {
        orderNumber,
        employeeId: appointment.employeeId,
        contractType: dto.contractType as any,
        startDate: new Date(dto.newStartDate),
        endDate: new Date(dto.newEndDate),
        salary: dto.salary,
        designationId: appointment.designationId,
        departmentId: appointment.departmentId,
        termsAndConditions: appointment.termsAndConditions,
        status: 'ACTIVE',
      },
    });

    return renewal;
  }
}
