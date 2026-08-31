import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { addDays } from 'date-fns';

@Injectable()
export class ExtensionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(employeeId?: string) {
    return this.prisma.appointment.findMany({
      where: { contractType: 'EXTENSION', ...(employeeId ? { employeeId } : {}) },
      include: { employee: { select: { id: true, name: true, code: true } }, previousAppointment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: { employeeId: string; previousAppointmentId: string; orderNumber?: string; orderDate?: string; startDate: string; endDate?: string; periodDays?: number; reason?: string }) {
    const [employee, previous] = await Promise.all([
      this.prisma.employee.findUnique({ where: { id: dto.employeeId } }),
      this.prisma.appointment.findUnique({ where: { id: dto.previousAppointmentId } }),
    ]);
    if (!employee) throw new NotFoundException('Employee not found');
    if (!previous) throw new NotFoundException('Previous appointment not found');
    if (previous.employeeId !== employee.id) throw new BadRequestException('Previous appointment must belong to this employee');
    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : dto.periodDays ? addDays(startDate, dto.periodDays) : null;
    if (!endDate) throw new BadRequestException('Extension end date or period days is required');
    const orderNumber = dto.orderNumber || `EXT-${new Date().getFullYear()}-${String((await this.prisma.appointment.count({ where: { contractType: 'EXTENSION' } })) + 1).padStart(3, '0')}`;
    return this.prisma.$transaction(async (tx) => {
      await tx.appointment.update({ where: { id: previous.id }, data: { status: 'RENEWED' } });
      return tx.appointment.create({
        data: {
          orderNumber, orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(), employeeId: employee.id,
          contractType: 'EXTENSION', startDate, endDate, salary: employee.salary, designationId: employee.designationId,
          departmentId: employee.departmentId, sectionId: employee.sectionId, termsAndConditions: dto.reason || 'Extension of existing appointment.',
          previousAppointmentId: previous.id, status: 'ACTIVE',
        },
        include: { employee: { select: { id: true, name: true, code: true } }, previousAppointment: true },
      });
    });
  }
}
