import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAttendanceDto, QueryAttendanceDto,
  BulkAttendanceDto, RejectAttendanceDto,
} from './dto/attendance.dto';
import { paginate } from '../../common/dto/pagination.dto';

const ATTENDANCE_INCLUDE = {
  employee: { select: { id: true, name: true, code: true, photo: true } },
};

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAttendanceDto) {
    const { employeeId, date, month, year, approvalStatus, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (employeeId) where.employeeId = employeeId;
    if (approvalStatus) where.approvalStatus = approvalStatus;

    if (date) {
      const d = new Date(date);
      where.date = d;
    } else if (month && year) {
      const start = new Date(year, parseInt(month) - 1, 1);
      const end = new Date(year, parseInt(month), 0);
      where.date = { gte: start, lte: end };
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where, include: ATTENDANCE_INCLUDE, skip, take: limit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async create(dto: CreateAttendanceDto) {
    const date = new Date(dto.date);

    // 1. Check if employee is on an active Service Break on this date
    const activeBreak = await this.prisma.serviceBreak.findFirst({
      where: {
        employeeId: dto.employeeId,
        breakStartDate: { lte: date },
        breakEndDate: { gte: date },
      },
    });

    if (activeBreak && !dto.override && dto.status !== 'SERVICE_BREAK') {
      throw new BadRequestException(
        'Service Break – Attendance cannot be marked. (Requires Establishment Officer override)',
      );
    }

    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: dto.employeeId, date } },
    });
    if (existing) throw new ConflictException('Attendance already recorded for this date');

    const { override, ...data } = dto;
    return this.prisma.attendance.create({
      data: { ...data, date },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async bulkCreate(dto: BulkAttendanceDto) {
    const results = await Promise.allSettled(
      (dto.records || []).map((r) => this.create(r)),
    );
    return {
      created: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    };
  }

  async approve(id: string, approvedById: string) {
    await this.findById(id);
    return this.prisma.attendance.update({
      where: { id },
      data: { approvalStatus: 'APPROVED', approvedById },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async reject(id: string, dto: RejectAttendanceDto) {
    await this.findById(id);
    return this.prisma.attendance.update({
      where: { id },
      data: { approvalStatus: 'REJECTED', remarks: dto.reason },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async getDailySummary(date: string) {
    const d = new Date(date);
    const records = await this.prisma.attendance.findMany({
      where: { date: d },
      include: ATTENDANCE_INCLUDE,
    });

    return {
      date,
      total: records.length,
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
      onLeave: records.filter((r) => r.status === 'LEAVE').length,
      off: records.filter((r) => r.status === 'OFF').length,
      od: records.filter((r) => r.status === 'OD').length,
      serviceBreak: records.filter((r) => r.status === 'SERVICE_BREAK').length,
      pending: records.filter((r) => r.approvalStatus === 'PENDING').length,
      approved: records.filter((r) => r.approvalStatus === 'APPROVED').length,
    };
  }

  private async findById(id: string) {
    const a = await this.prisma.attendance.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Attendance record not found');
    return a;
  }
}
