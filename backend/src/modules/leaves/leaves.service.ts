import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeaveDto, RejectLeaveDto } from './dto/leave.dto';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  async findAll(employeeId?: string, status?: string) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    return this.prisma.leave.findMany({
      where,
      include: { employee: { select: { id: true, name: true, code: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBalance(employeeId: string, user?: any) {
    if (user?.role === 'EMPLOYEE' && user.employeeId !== employeeId) {
      throw new ForbiddenException('Employees can only access their own leave balance');
    }
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.prisma.leaveBalance.upsert({
      where: { employeeId },
      update: {},
      create: { employeeId },
    });
  }

  async create(dto: CreateLeaveDto) {
    return this.prisma.leave.create({
      data: {
        employeeId: dto.employeeId,
        leaveType: dto.leaveType,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
      },
      include: { employee: true },
    });
  }

  async approve(id: string, user: { id: string; role: string }) {
    const leave = await this.prisma.leave.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Leave application not found');

    if (leave.status !== 'PENDING') {
      throw new BadRequestException('Only pending leave applications can be approved');
    }

    if (user.role === 'SUPERVISOR') {
      return this.prisma.leave.update({
        where: { id },
        data: { supervisorStatus: 'APPROVED', approvedById: user.id },
        include: { employee: true },
      });
    }
    if (user.role !== 'ADMIN' && user.role !== 'ESTABLISHMENT_OFFICER') {
      throw new BadRequestException('Only a supervisor or Establishment Officer can approve leave');
    }
    if (user.role !== 'ADMIN' && leave.supervisorStatus !== 'APPROVED') {
      throw new BadRequestException('Supervisor approval is required before establishment approval');
    }

    const updated = await this.prisma.leave.update({
      where: { id },
      data: { status: 'APPROVED', establishmentStatus: 'APPROVED', approvedById: user.id },
      include: { employee: true },
    });

    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const dates: Date[] = [];
    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date));
    }
    await this.prisma.$transaction(dates.map((date) => this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: leave.employeeId, date } },
      update: { status: 'LEAVE', approvalStatus: 'APPROVED', establishmentVerified: true, verifiedById: user.id },
      create: {
        employeeId: leave.employeeId,
        date,
        status: 'LEAVE',
        approvalStatus: 'APPROVED',
        establishmentVerified: true,
        verifiedById: user.id,
        remarks: `Approved ${leave.leaveType.toLowerCase()} leave`,
      },
    })));

    // Automatically set employee status to LEAVE if start date is active
    await this.prisma.employee.update({
      where: { id: leave.employeeId },
      data: { status: 'LEAVE' },
    });

    return updated;
  }

  async reject(id: string, dto: RejectLeaveDto) {
    const leave = await this.prisma.leave.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Leave application not found');

    return this.prisma.leave.update({
      where: { id },
      data: { status: 'REJECTED', remarks: dto.reason },
      include: { employee: true },
    });
  }
}
