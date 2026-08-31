import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentDto, QueryAppointmentDto } from './dto/appointment.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { addDays } from 'date-fns';

const APPT_INCLUDE = {
  employee: { select: { id: true, name: true, code: true, photo: true, email: true, status: true } },
  department: { select: { id: true, name: true, code: true } },
  section: { select: { id: true, name: true, code: true } },
  designation: { select: { id: true, name: true, code: true } },
  previousAppointment: { select: { id: true, orderNumber: true, endDate: true, contractType: true } },
};

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAppointmentDto) {
    const { employeeId, contractType, status, page = 1, limit = 100 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (contractType) where.contractType = contractType;
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
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: { designation: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    // An appointment belongs to the employee's current posting and pay grade.
    // Do not allow a manually entered order to diverge from the employee record.
    const salary = employee.salary || employee.designation.basicPay;
    const departmentId = employee.departmentId;
    const sectionId = employee.sectionId;
    const designationId = employee.designationId;
    const startDate = new Date(dto.startDate);
    let endDate: Date;
    let serviceBreakApplicable = dto.serviceBreakApplicable ?? false;
    let breakDueDate: Date | null = dto.breakDueDate ? new Date(dto.breakDueDate) : null;

    // Fetch system settings for contract durations
    const settings = await this.prisma.systemSetting.findMany({
      where: { key: { in: ['89_days_duration', '178_days_duration', 'one_year_duration'] } },
    });
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, parseInt(s.value, 10)]));

    const duration89 = settingsMap['89_days_duration'];
    const duration178 = settingsMap['178_days_duration'];
    const durationOneYear = settingsMap['one_year_duration'];
    if (!duration89 || !duration178 || !durationOneYear) {
      throw new BadRequestException('Appointment duration settings are incomplete');
    }

    if (dto.contractType === 'DAYS_89') {
      endDate = addDays(startDate, duration89);
    } else if (dto.contractType === 'DAYS_178') {
      endDate = addDays(startDate, duration178);
      serviceBreakApplicable = true;
      breakDueDate = addDays(startDate, duration178);
    } else if (dto.contractType === 'ONE_YEAR') {
      endDate = addDays(startDate, durationOneYear);
    } else {
      if (!dto.endDate) throw new BadRequestException('End date is required for custom contract type');
      endDate = new Date(dto.endDate);
    }

    if (dto.contractType === 'EXTENSION' && dto.previousAppointmentId) {
      const prev = await this.prisma.appointment.findUnique({ where: { id: dto.previousAppointmentId } });
      if (!prev) throw new NotFoundException('Previous appointment for extension not found');
      if (prev.employeeId !== dto.employeeId) {
        throw new BadRequestException('Previous appointment must belong to the selected employee');
      }
    }

    const orderNumber = dto.orderNumber || await this.generateOrderNumber();
    const orderDate = dto.orderDate ? new Date(dto.orderDate) : new Date();

    const appointment = await this.prisma.appointment.create({
      data: {
        orderNumber,
        orderDate,
        employeeId: dto.employeeId,
        contractType: dto.contractType as any,
        startDate,
        endDate,
        salary,
        designationId,
        departmentId,
        sectionId: sectionId ?? null,
        termsAndConditions: dto.termsAndConditions ?? 'Standard terms apply.',
        status: 'ACTIVE',
        joiningReportUrl: dto.joiningReportUrl ?? null,
        agreementUrl: dto.agreementUrl ?? null,
        appointmentPdfUrl: dto.appointmentPdfUrl ?? null,
        previousAppointmentId: dto.previousAppointmentId ?? null,
        serviceBreakApplicable,
        breakDueDate,
      },
      include: APPT_INCLUDE,
    });

    // Automatically sync employee active appointmentType and status
    await this.prisma.employee.update({
      where: { id: dto.employeeId },
      data: {
        appointmentType: dto.contractType as any,
        departmentId,
        sectionId: sectionId ?? undefined,
        designationId,
        salary,
        status: 'ACTIVE',
      },
    });

    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (dto.orderDate) data.orderDate = new Date(dto.orderDate);
    if (dto.breakDueDate) data.breakDueDate = new Date(dto.breakDueDate);
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
