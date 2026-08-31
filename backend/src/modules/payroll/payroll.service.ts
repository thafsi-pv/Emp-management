import {
  Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeneratePayrollDto, QueryPayrollDto } from './dto/payroll.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { getDaysInMonth } from 'date-fns';

const PAYROLL_INCLUDE = {
  employee: {
    select: {
      id: true, name: true, code: true, photo: true, bankName: true, accountNumber: true, ifscCode: true,
      department: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      designation: { select: { id: true, name: true, payType: true, basicPay: true, weightage: true, allowance: true, otRate: true } },
    },
  },
};

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryPayrollDto) {
    const { employeeId, month, year, status, page = 1, limit = 100 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = month;
    if (year) where.year = year;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.payroll.findMany({
        where, include: PAYROLL_INCLUDE, skip, take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      this.prisma.payroll.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const payroll = await this.prisma.payroll.findUnique({ where: { id }, include: PAYROLL_INCLUDE });
    if (!payroll) throw new NotFoundException('Payroll record not found');
    return payroll;
  }

  async findOneForUser(id: string, user: any) {
    const payroll = await this.findOne(id);
    if (user?.role === 'EMPLOYEE' && payroll.employeeId !== user.employeeId) {
      throw new ForbiddenException('Employees can only access their own payroll records');
    }
    return payroll;
  }

  async generate(dto: GeneratePayrollDto) {
    const { employeeId, month, year } = dto;

    const existing = await this.prisma.payroll.findUnique({
      where: { employeeId_month_year: { employeeId, month, year } },
    });
    if (existing) throw new ConflictException('Payroll already generated for this employee and period');

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { designation: true, department: true, section: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const totalWorkingDays = this.getWorkingDaysInMonth(parseInt(month), year);

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        approvalStatus: 'APPROVED',
        establishmentVerified: true,
        date: {
          gte: new Date(year, parseInt(month) - 1, 1),
          lte: new Date(year, parseInt(month), 0),
        },
      },
    });

    const workedDays = attendanceRecords.reduce((sum, r) => {
      if (r.status === 'PRESENT' || r.status === 'OD' || r.status === 'HOLIDAY') return sum + 1;
      if (r.status === 'HALF_DAY') return sum + 0.5;
      return sum;
    }, 0);

    const designation = employee.designation;
    const isDaily = designation.payType === 'DAILY';

    const basicSalary = isDaily ? (designation.basicPay || employee.salary) : (employee.salary || designation.basicPay);
    const weightage = designation.weightage || 0;
    const allowance = dto.allowance ?? (designation.allowance || 0);
    const bonus = dto.bonus ?? 0;
    const gratuity = dto.gratuity ?? 0;
    const deduction = dto.deduction ?? 0;
    const overtime = dto.overtime ?? 0;

    let netSalary: number;

    if (isDaily) {
      // Daily Pay = Basic × Eligible Days + Weightage + OT + Allowances − Deductions
      netSalary = (basicSalary * workedDays) + weightage + overtime + allowance + bonus + gratuity - deduction;
    } else {
      // Monthly Pay = Monthly Basic + Weightage + Allowances + OT − Deductions
      const earnedBasic = totalWorkingDays > 0 ? (basicSalary / totalWorkingDays) * workedDays : basicSalary;
      netSalary = earnedBasic + weightage + allowance + bonus + gratuity + overtime - deduction;
    }

    return this.prisma.payroll.create({
      data: {
        employeeId,
        month,
        year,
        totalWorkingDays,
        workedDays: Math.round(workedDays * 10) / 10,
        basicSalary,
        allowance,
        bonus,
        gratuity,
        deduction,
        overtime,
        netSalary: Math.round(netSalary * 100) / 100,
        status: 'DRAFT',
      },
      include: PAYROLL_INCLUDE,
    });
  }

  async approve(id: string) {
    const payroll = await this.findOne(id);
    if (payroll.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT payroll can be approved');
    }
    return this.prisma.payroll.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: PAYROLL_INCLUDE,
    });
  }

  async markPaid(id: string) {
    const payroll = await this.findOne(id);
    if (payroll.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED payroll can be marked as paid');
    }
    return this.prisma.payroll.update({
      where: { id },
      data: { status: 'PAID' },
      include: PAYROLL_INCLUDE,
    });
  }

  async getMonthlySummary(month: string, year: number) {
    const records = await this.prisma.payroll.findMany({
      where: { month, year },
      include: PAYROLL_INCLUDE,
    });

    const totalNet = records.reduce((s, r) => s + r.netSalary, 0);
    const totalBasic = records.reduce((s, r) => s + r.basicSalary, 0);
    const totalDeductions = records.reduce((s, r) => s + r.deduction, 0);

    return {
      month,
      year,
      totalEmployees: records.length,
      totalNetSalary: totalNet,
      totalBasicSalary: totalBasic,
      totalDeductions,
      approved: records.filter((r) => r.status === 'APPROVED' || r.status === 'PAID').length,
      pending: records.filter((r) => r.status === 'DRAFT').length,
    };
  }

  async findRuns() {
    return this.prisma.payrollRun.findMany({
      include: { _count: { select: { entries: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async createRun(month: number, year: number) {
    return this.prisma.payrollRun.upsert({
      where: { month_year: { month, year } },
      update: {}, create: { month, year },
      include: { entries: true },
    });
  }

  async generateRun(id: string) {
    const run = await this.prisma.payrollRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (run.status !== 'DRAFT') throw new BadRequestException('Only draft payroll runs can be generated');
    const employees = await this.prisma.employee.findMany({ where: { status: 'ACTIVE' }, include: { designation: true } });
    const start = new Date(run.year, run.month - 1, 1);
    const end = new Date(run.year, run.month, 0);
    await this.prisma.$transaction(async (tx) => {
      for (const employee of employees) {
      const attendance = await tx.attendance.findMany({ where: { employeeId: employee.id, establishmentVerified: true, date: { gte: start, lte: end } } });
      const presentDays = attendance.reduce((total, row) => total + (row.status === 'HALF_DAY' ? .5 : ['PRESENT', 'OD', 'HOLIDAY', 'LEAVE'].includes(row.status) ? 1 : 0), 0);
      const absentDays = attendance.filter((row) => row.status === 'ABSENT').length;
      const overtime = attendance.reduce((total, row) => total + (row.otHours || 0), 0) * employee.designation.otRate;
      const basicPay = employee.salary || employee.designation.basicPay;
      const isDaily = employee.designation.payType === 'DAILY';
      const netPay = (isDaily ? basicPay * presentDays : basicPay) + employee.designation.weightage + employee.designation.allowance + overtime;
      await tx.payrollEntry.upsert({
        where: { payrollRunId_employeeId: { payrollRunId: run.id, employeeId: employee.id } },
        update: { basicPay, weightage: employee.designation.weightage, allowance: employee.designation.allowance, overtime, presentDays, absentDays, netPay },
        create: { payrollRunId: run.id, employeeId: employee.id, basicPay, weightage: employee.designation.weightage, allowance: employee.designation.allowance, overtime, presentDays, absentDays, netPay },
      });
      }
    });
    return this.prisma.payrollRun.findUnique({ where: { id }, include: { entries: { include: { employee: { select: { name: true, code: true } } } } } });
  }

  async findRun(id: string) {
    const run = await this.prisma.payrollRun.findUnique({ where: { id }, include: { entries: { include: { employee: { select: { name: true, code: true, bankName: true, accountNumber: true, ifscCode: true } } } } } });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  private getWorkingDaysInMonth(month: number, year: number): number {
    const days = getDaysInMonth(new Date(year, month - 1));
    let workingDays = 0;
    for (let d = 1; d <= days; d++) {
      const dayOfWeek = new Date(year, month - 1, d).getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++; // Skip weekends (Sat & Sun)
    }
    return workingDays;
  }
}
