import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
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
