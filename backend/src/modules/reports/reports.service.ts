import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  catalog() {
    return [
      { type: 'establishment', name: 'Establishment Register', category: 'Establishment' },
      { type: 'employees', name: 'Department-wise Employee List', category: 'Establishment' },
      { type: 'attendance', name: 'Daily / Monthly Attendance', category: 'Attendance' },
      { type: 'service-break', name: 'Service Break Report', category: 'Attendance' },
      { type: 'appointments', name: 'Appointment Expiry Report', category: 'Appointments' },
      { type: 'extensions', name: 'Extension / Renewal Report', category: 'Appointments' },
      { type: 'pay-structure', name: 'Pay Structure Report', category: 'Payroll' },
      { type: 'payroll', name: 'Monthly Payroll Register', category: 'Payroll' },
      { type: 'separation', name: 'Resignation / Termination Report', category: 'Separation' },
      { type: 'final-settlement', name: 'Final Settlement Report', category: 'Separation' },
    ];
  }

  async getCatalogReport(type: string, params: { month?: string; year?: number; departmentId?: string }) {
    switch (type) {
      case 'establishment': return this.getEstablishmentRegister(params.departmentId);
      case 'employees': return this.getEmployeeReport({ departmentId: params.departmentId });
      case 'attendance': return this.getAttendanceReport({ month: params.month, year: params.year });
      case 'service-break': return this.getServiceBreakAudit();
      case 'pay-structure': return this.getPayStructureMatrix(params.departmentId);
      case 'payroll': return this.getPayrollReport({ month: params.month, year: params.year, departmentId: params.departmentId });
      case 'appointments': return this.getContractReport({ status: 'ACTIVE' });
      case 'extensions': return this.prisma.appointment.findMany({
        where: { contractType: 'EXTENSION' }, include: { employee: { select: { name: true, code: true } }, previousAppointment: true }, orderBy: { createdAt: 'desc' },
      });
      case 'separation': return this.prisma.contractTermination.findMany({
        include: { employee: { select: { name: true, code: true, status: true } } }, orderBy: { terminationDate: 'desc' },
      });
      case 'final-settlement': return this.prisma.finalSettlement.findMany({
        include: { employee: { select: { name: true, code: true, status: true } } }, orderBy: { settlementDate: 'desc' },
      });
      default: throw new Error(`Unknown report type: ${type}`);
    }
  }

  async getEstablishmentRegister(departmentId?: string) {
    const employees = await this.prisma.employee.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true, payType: true, basicPay: true } },
      },
      orderBy: { name: 'asc' },
    });

    const today = new Date();
    return {
      data: employees.map((employee) => ({
        ...employee,
        employmentType: employee.designation.payType,
        basicSalary: employee.salary || employee.designation.basicPay,
        tenureMonths: Math.max(0, Math.floor(
          (today.getFullYear() - employee.joiningDate.getFullYear()) * 12
          + today.getMonth() - employee.joiningDate.getMonth(),
        )),
      })),
    };
  }

  async getServiceBreakAudit() {
    const [employees, settings] = await Promise.all([
      this.prisma.employee.findMany({
        include: {
          appointments: {
            where: { status: 'ACTIVE' },
            orderBy: { startDate: 'desc' },
            take: 1,
            select: { breakDueDate: true },
          },
          serviceBreaks: { orderBy: { breakEndDate: 'desc' }, take: 1, select: { breakEndDate: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.systemSetting.findMany({
        where: { key: { in: ['serviceBreakDays', 'appointment178Days'] } },
      }),
    ]);
    const config = new Map(settings.map((setting) => [setting.key, Number(setting.value)]));
    const breakThreshold = config.get('appointment178Days') || config.get('serviceBreakDays') || 178;
    const today = new Date();

    return {
      data: employees.map((employee) => {
        const latestBreak = employee.serviceBreaks[0]?.breakEndDate;
        const activeFrom = latestBreak && latestBreak > employee.joiningDate ? latestBreak : employee.joiningDate;
        const activeDays = Math.max(0, Math.floor((today.getTime() - activeFrom.getTime()) / 86_400_000));
        return {
          id: employee.id,
          code: employee.code,
          name: employee.name,
          joiningDate: employee.joiningDate,
          activeDays,
          nextBreakDueDate: employee.appointments[0]?.breakDueDate?.toISOString() ?? null,
          status: employee.status,
          breakThreshold,
        };
      }),
    };
  }

  async getPayStructureMatrix(departmentId?: string) {
    const employees = await this.prisma.employee.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        designation: { select: { payType: true, basicPay: true, allowance: true, weightage: true } },
        payRevisions: {
          where: { status: 'APPROVED', effectiveDate: { lte: new Date() } },
          orderBy: { effectiveDate: 'desc' },
          take: 1,
          select: { newBasicPay: true, newAllowance: true, newWeightage: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      data: employees.map((employee) => {
        const revision = employee.payRevisions[0];
        const basicSalary = revision?.newBasicPay ?? employee.salary ?? employee.designation.basicPay;
        const allowance = revision?.newAllowance ?? employee.designation.allowance;
        const weightage = revision?.newWeightage ?? employee.designation.weightage;
        return {
          id: employee.id,
          code: employee.code,
          name: employee.name,
          employmentType: employee.designation.payType,
          basicSalary,
          allowance,
          weightage,
          estimatedNetPay: basicSalary + allowance + weightage,
        };
      }),
    };
  }

  async getEmployeeReport(params: { departmentId?: string; designationId?: string; status?: string }) {
    const where: any = {};
    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.designationId) where.designationId = params.designationId;
    if (params.status) where.status = params.status;

    const employees = await this.prisma.employee.findMany({
      where,
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const byDepartment = await this.prisma.employee.groupBy({
      by: ['departmentId'],
      _count: true,
    });

    return { employees, totalCount: employees.length, byDepartment };
  }

  async getAttendanceReport(params: { month?: string; year?: number; employeeId?: string }) {
    const where: any = {};
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.month && params.year) {
      where.date = {
        gte: new Date(params.year, parseInt(params.month) - 1, 1),
        lte: new Date(params.year, parseInt(params.month), 0),
      };
    }

    const records = await this.prisma.attendance.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, code: true, department: { select: { name: true } } } },
      },
      orderBy: [{ date: 'asc' }],
    });

    const summary = {
      total: records.length,
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
      onLeave: records.filter((r) => r.status === 'LEAVE').length,
    };

    return { records, summary };
  }

  async getPayrollReport(params: { month?: string; year?: number; departmentId?: string }) {
    const where: any = {};
    if (params.month) where.month = params.month;
    if (params.year) where.year = params.year;

    const payrolls = await this.prisma.payroll.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true, name: true, code: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const filteredByDept = params.departmentId
      ? payrolls.filter((p) => p.employee.department?.id === params.departmentId)
      : payrolls;

    const summary = {
      totalEmployees: filteredByDept.length,
      totalNetSalary: filteredByDept.reduce((s, r) => s + r.netSalary, 0),
      totalBasicSalary: filteredByDept.reduce((s, r) => s + r.basicSalary, 0),
      totalDeductions: filteredByDept.reduce((s, r) => s + r.deduction, 0),
      totalBonus: filteredByDept.reduce((s, r) => s + r.bonus, 0),
    };

    return { payrolls: filteredByDept, summary };
  }

  async getContractReport(params: { status?: string }) {
    const where: any = {};
    if (params.status) where.status = params.status;

    const [appointments, renewals, terminations] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          employee: { select: { id: true, name: true, code: true } },
          department: { select: { name: true } },
          designation: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contractRenewal.count(),
      this.prisma.contractTermination.count(),
    ]);

    const stats = {
      total: appointments.length,
      active: appointments.filter((a) => a.status === 'ACTIVE').length,
      expired: appointments.filter((a) => a.status === 'EXPIRED').length,
      terminated: appointments.filter((a) => a.status === 'TERMINATED').length,
      renewed: appointments.filter((a) => a.status === 'RENEWED').length,
      totalRenewals: renewals,
      totalTerminations: terminations,
    };

    return { appointments, stats };
  }

  async getDashboardStats() {
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalEmployees, activeEmployees, terminatedEmployees,
      contractsExpiringSoon, activeContracts,
      todayAttendance, pendingApprovals,
      thisMonthPayroll,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { status: 'TERMINATED' } }),
      this.prisma.appointment.count({
        where: { status: 'ACTIVE', endDate: { gte: today, lte: in30Days } },
      }),
      this.prisma.appointment.count({ where: { status: 'ACTIVE' } }),
      this.prisma.attendance.findMany({
        where: { date: today },
        select: { status: true, approvalStatus: true },
      }),
      this.prisma.attendance.count({ where: { approvalStatus: 'PENDING' } }),
      this.prisma.payroll.aggregate({
        where: { month: String(thisMonth).padStart(2, '0'), year: thisYear },
        _sum: { netSalary: true },
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      terminatedEmployees,
      contractsExpiringSoon,
      activeContracts,
      attendanceToday: {
        total: todayAttendance.length,
        present: todayAttendance.filter((a) => a.status === 'PRESENT').length,
        absent: todayAttendance.filter((a) => a.status === 'ABSENT').length,
        percentage: todayAttendance.length > 0
          ? Math.round((todayAttendance.filter((a) => a.status === 'PRESENT').length / todayAttendance.length) * 100)
          : 0,
      },
      pendingApprovals,
      payrollThisMonth: thisMonthPayroll._sum.netSalary ?? 0,
    };
  }
}
