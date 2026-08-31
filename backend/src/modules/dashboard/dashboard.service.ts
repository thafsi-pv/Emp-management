import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const statuses = ['ACTIVE', 'LEAVE', 'OFF', 'SERVICE_BREAK', 'EXPIRED', 'RESIGNED', 'TERMINATED'] as const;
    const counts = await Promise.all(statuses.map((status) => this.prisma.employee.count({ where: { status } })));
    const [total, expiring] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.appointment.count({
        where: { status: 'ACTIVE', endDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86_400_000) } },
      }),
    ]);
    return { total, expiring, ...Object.fromEntries(statuses.map((status, index) => [status.toLowerCase(), counts[index]])) };
  }

  async strength() {
    const [department, section, designation] = await Promise.all([
      this.prisma.employee.groupBy({ by: ['departmentId'], where: { status: 'ACTIVE' }, _count: true }),
      this.prisma.employee.groupBy({ by: ['sectionId'], where: { status: 'ACTIVE' }, _count: true }),
      this.prisma.employee.groupBy({ by: ['designationId'], where: { status: 'ACTIVE' }, _count: true }),
    ]);
    const [departments, sections, designations] = await Promise.all([
      this.prisma.department.findMany({ select: { id: true, name: true } }),
      this.prisma.section.findMany({ select: { id: true, name: true } }),
      this.prisma.designation.findMany({ select: { id: true, name: true } }),
    ]);
    const format = (rows: Array<{ [key: string]: any; _count: number }>, key: string, labels: Array<{ id: string; name: string }>) =>
      rows.map((row) => ({ id: row[key], name: labels.find((item) => item.id === row[key])?.name ?? 'Unassigned', count: row._count }));
    return { department: format(department, 'departmentId', departments), section: format(section, 'sectionId', sections), designation: format(designation, 'designationId', designations) };
  }

  async attendanceToday() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const records = await this.prisma.attendance.findMany({ where: { date }, select: { status: true, approvalStatus: true, establishmentVerified: true } });
    const byStatus = records.reduce((counts: Record<string, number>, record: { status: string }) => ({ ...counts, [record.status]: (counts[record.status] ?? 0) + 1 }), {} as Record<string, number>);
    return { total: records.length, byStatus, pendingVerification: records.filter((record) => !record.establishmentVerified).length, pendingApproval: records.filter((record) => record.approvalStatus === 'PENDING').length };
  }

  async pending() {
    const [attendance, leaves, payroll, appointments, terminations] = await Promise.all([
      this.prisma.attendance.count({ where: { approvalStatus: 'PENDING' } }),
      this.prisma.leave.count({ where: { status: 'PENDING' } }),
      this.prisma.payroll.count({ where: { status: 'DRAFT' } }),
      this.prisma.appointment.count({ where: { status: 'ACTIVE', endDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86_400_000) } } }),
      this.prisma.contractTermination.count(),
    ]);
    return { attendance, leaves, payroll, appointments, terminations };
  }
}
