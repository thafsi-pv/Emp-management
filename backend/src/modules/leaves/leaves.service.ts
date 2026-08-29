import { Injectable, NotFoundException } from '@nestjs/common';
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

  async approve(id: string, approvedById?: string) {
    const leave = await this.prisma.leave.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('Leave application not found');

    // Update leave status to APPROVED
    const updated = await this.prisma.leave.update({
      where: { id },
      data: { status: 'APPROVED', approvedById },
      include: { employee: true },
    });

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
