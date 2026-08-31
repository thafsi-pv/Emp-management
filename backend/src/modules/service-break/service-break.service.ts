import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceBreakDto, UpdateServiceBreakDto, QueryServiceBreakDto } from './dto/service-break.dto';
import { paginate } from '../../common/dto/pagination.dto';

const INCLUDE = {
  employee: {
    select: {
      id: true, name: true, code: true,
      department: { select: { id: true, name: true } },
    },
  },
};

@Injectable()
export class ServiceBreakService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryServiceBreakDto) {
    const { employeeId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const [data, total] = await Promise.all([
      this.prisma.serviceBreak.findMany({
        where, include: INCLUDE, skip, take: limit,
        orderBy: { breakStartDate: 'desc' },
      }),
      this.prisma.serviceBreak.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const sb = await this.prisma.serviceBreak.findUnique({ where: { id }, include: INCLUDE });
    if (!sb) throw new NotFoundException('Service break not found');
    return sb;
  }

  async dueList() {
    const today = new Date();
    return this.prisma.appointment.findMany({
      where: {
        status: 'ACTIVE',
        serviceBreakApplicable: true,
        breakDueDate: { lte: new Date(today.getTime() + 30 * 86_400_000) },
      },
      include: {
        employee: { select: { id: true, name: true, code: true, status: true } },
        department: { select: { name: true } },
        section: { select: { name: true } },
      },
      orderBy: { breakDueDate: 'asc' },
    });
  }

  async activeList() {
    return this.prisma.serviceBreak.findMany({
      where: { status: 'ACTIVE' }, include: INCLUDE, orderBy: { breakEndDate: 'asc' },
    });
  }

  async create(dto: CreateServiceBreakDto) {
    return this.prisma.serviceBreak.create({
      data: {
        ...dto,
        breakStartDate: new Date(dto.breakStartDate),
        breakEndDate: new Date(dto.breakEndDate),
      },
      include: INCLUDE,
    });
  }

  async startForAppointment(appointmentId: string, dto: CreateServiceBreakDto) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.employeeId !== dto.employeeId) throw new BadRequestException('Employee does not match appointment');
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.serviceBreak.upsert({
        where: { appointmentId },
        update: { breakStartDate: new Date(dto.breakStartDate), breakEndDate: new Date(dto.breakEndDate), reason: dto.reason, remarks: dto.remarks, applicable: true, day178Date: appointment.breakDueDate, breakDueDate: appointment.breakDueDate, status: 'ACTIVE' },
        create: { employeeId: dto.employeeId, appointmentId, breakStartDate: new Date(dto.breakStartDate), breakEndDate: new Date(dto.breakEndDate), reason: dto.reason, remarks: dto.remarks, applicable: true, day178Date: appointment.breakDueDate, breakDueDate: appointment.breakDueDate, status: 'ACTIVE' },
        include: INCLUDE,
      });
      await tx.employee.update({ where: { id: dto.employeeId }, data: { status: 'SERVICE_BREAK' } });
      return record;
    });
  }

  async complete(id: string) {
    const record = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.serviceBreak.update({ where: { id }, data: { status: 'COMPLETED' }, include: INCLUDE });
      await tx.employee.update({ where: { id: record.employeeId }, data: { status: 'ACTIVE' } });
      return updated;
    });
  }

  async update(id: string, dto: UpdateServiceBreakDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.breakStartDate) data.breakStartDate = new Date(dto.breakStartDate);
    if (dto.breakEndDate) data.breakEndDate = new Date(dto.breakEndDate);
    return this.prisma.serviceBreak.update({ where: { id }, data, include: INCLUDE });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.serviceBreak.delete({ where: { id } });
  }
}
