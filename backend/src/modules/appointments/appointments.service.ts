import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentDto, QueryAppointmentDto } from './dto/appointment.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { addDays, format } from 'date-fns';

const APPT_INCLUDE = {
  employee: { select: { id: true, name: true, code: true, photo: true } },
  department: { select: { id: true, name: true } },
  designation: { select: { id: true, name: true } },
};

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAppointmentDto) {
    const { employeeId, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({ where, include: APPT_INCLUDE, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.appointment.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id }, include: APPT_INCLUDE });
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }

  async create(dto: CreateAppointmentDto) {
    const orderNumber = await this.generateOrderNumber();
    return this.prisma.appointment.create({
      data: {
        ...dto,
        orderNumber,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      include: APPT_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.appointment.update({ where: { id }, data, include: APPT_INCLUDE });
  }

  async getExpiring(days: number) {
    const now = new Date();
    const future = addDays(now, days);
    return this.prisma.appointment.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now, lte: future },
      },
      include: APPT_INCLUDE,
      orderBy: { endDate: 'asc' },
    });
  }

  async updateExpiredContracts() {
    const now = new Date();
    await this.prisma.appointment.updateMany({
      where: { status: 'ACTIVE', endDate: { lt: now } },
      data: { status: 'EXPIRED' },
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.appointment.count({
      where: { orderNumber: { startsWith: `APT-${year}-` } },
    });
    return `APT-${year}-${String(count + 1).padStart(3, '0')}`;
  }
}
