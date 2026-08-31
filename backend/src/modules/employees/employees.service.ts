import {
  Injectable, NotFoundException, ConflictException, ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto, QueryEmployeeDto } from './dto/employee.dto';
import { paginate } from '../../common/dto/pagination.dto';

const EMPLOYEE_INCLUDE = {
  department: { select: { id: true, name: true, code: true } },
  section: { select: { id: true, name: true, code: true } },
  designation: { select: { id: true, name: true, code: true, payType: true, basicPay: true, weightage: true, allowance: true, otRate: true } },
  supervisor: { select: { id: true, name: true, code: true } },
};

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryEmployeeDto, user?: any) {
    const { search, departmentId, sectionId, designationId, supervisorId, status, page = 1, limit = 100 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (departmentId) where.departmentId = departmentId;
    if (sectionId) where.sectionId = sectionId;
    if (designationId) where.designationId = designationId;
    if (supervisorId) where.supervisorId = supervisorId;
    if (status) where.status = status;

    if (user && user.role === 'SUPERVISOR' && user.employeeId) {
      where.supervisorId = user.employeeId;
    }

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({ where, include: EMPLOYEE_INCLUDE, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.employee.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        ...EMPLOYEE_INCLUDE,
        appointments: {
          include: { department: true, section: true, designation: true },
          orderBy: { createdAt: 'desc' },
        },
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        payrolls: { orderBy: { createdAt: 'desc' }, take: 12 },
        serviceBreaks: { orderBy: { breakStartDate: 'desc' } },
        documents: { orderBy: { uploadedAt: 'desc' } },
        payRevisions: { orderBy: { effectiveDate: 'desc' } },
        terminations: { orderBy: { createdAt: 'desc' } },
        leaves: { orderBy: { startDate: 'desc' } },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async findOneForUser(id: string, user: any) {
    const employee = await this.findOne(id);
    this.assertCanView(employee, user);
    return employee;
  }

  async getPayStructureForUser(id: string, user: any) {
    const employee = await this.findOne(id);
    this.assertCanView(employee, user);
    const [versions, revisions] = await Promise.all([
      this.prisma.payStructure.findMany({
        where: { designationId: employee.designationId, effectiveFrom: { lte: new Date() } },
        orderBy: { effectiveFrom: 'desc' },
      }),
      this.prisma.payRevision.findMany({
        where: { employeeId: id },
        orderBy: { effectiveDate: 'asc' },
      }),
    ]);
    const version = versions[0];
    const approvedRevision = revisions.filter((revision) => revision.status === 'APPROVED').at(-1);
    const current = {
      basicPay: approvedRevision?.newBasicPay ?? version?.basicPay ?? employee.designation.basicPay ?? employee.salary,
      weightage: approvedRevision?.newWeightage ?? version?.weightage ?? employee.designation.weightage ?? 0,
      allowance: approvedRevision?.newAllowance ?? version?.allowance ?? employee.designation.allowance ?? 0,
      otRate: version?.otRate ?? employee.designation.otRate ?? 0,
      payType: version?.payType ?? employee.designation.payType,
      effectiveFrom: approvedRevision?.effectiveDate ?? version?.effectiveFrom ?? employee.joiningDate,
    };
    return { employeeId: employee.id, designation: employee.designation, current, payHistory: [...versions].reverse(), revisions };
  }

  async getServiceHistoryForUser(id: string, user: any) {
    const employee = await this.findOne(id);
    this.assertCanView(employee, user);
    return this.getServiceHistory(id);
  }

  async getServiceHistory(id: string) {
    const emp = await this.findOne(id);

    const timeline: any[] = [];

    // Joining
    timeline.push({
      date: emp.joiningDate,
      type: 'JOINING',
      title: 'Joined Service',
      description: `Joined as ${emp.designation?.name} in ${emp.department?.name}${emp.section ? ' (' + emp.section.name + ')' : ''}`,
    });

    // Appointments
    (emp.appointments || []).forEach((apt) => {
      timeline.push({
        date: apt.startDate,
        type: apt.contractType === 'EXTENSION' ? 'EXTENSION' : 'APPOINTMENT',
        title: `Appointment Order (${apt.contractType})`,
        description: `Order No: ${apt.orderNumber}, Duration: ${new Date(apt.startDate).toLocaleDateString()} to ${new Date(apt.endDate).toLocaleDateString()}`,
        details: apt,
      });
    });

    // Service Breaks
    (emp.serviceBreaks || []).forEach((sb) => {
      timeline.push({
        date: sb.breakStartDate,
        type: 'SERVICE_BREAK',
        title: 'Service Break',
        description: `Reason: ${sb.reason}. Period: ${new Date(sb.breakStartDate).toLocaleDateString()} to ${new Date(sb.breakEndDate).toLocaleDateString()}`,
        details: sb,
      });
    });

    // Pay Revisions
    (emp.payRevisions || []).forEach((pr) => {
      timeline.push({
        date: pr.effectiveDate,
        type: 'PAY_REVISION',
        title: 'Pay Revision',
        description: `Basic Pay revised from ${pr.oldBasicPay} to ${pr.newBasicPay}. Reason: ${pr.reason || 'Annual Revision'}`,
        details: pr,
      });
    });

    // Leaves
    (emp.leaves || []).forEach((lv) => {
      timeline.push({
        date: lv.startDate,
        type: 'LEAVE',
        title: `Leave Applied (${lv.leaveType})`,
        description: `Status: ${lv.status}. Period: ${new Date(lv.startDate).toLocaleDateString()} to ${new Date(lv.endDate).toLocaleDateString()}`,
        details: lv,
      });
    });

    // Terminations
    (emp.terminations || []).forEach((tm) => {
      timeline.push({
        date: tm.terminationDate,
        type: 'TERMINATION',
        title: 'Service Termination / Resignation',
        description: `Reason: ${tm.reason}`,
        details: tm,
      });
    });

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      employee: {
        id: emp.id,
        code: emp.code,
        name: emp.name,
        department: emp.department?.name,
        designation: emp.designation?.name,
        status: emp.status,
      },
      timeline,
    };
  }

  async create(dto: CreateEmployeeDto, photoPath?: string) {
    let finalCode = dto.code;

    if (!finalCode) {
      const prefixSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'EMP_CODE_PREFIX' }
      });
      const prefix = prefixSetting?.value || 'EMP-';

      const latestEmp = await this.prisma.employee.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
      });

      let nextNum = 1;
      if (latestEmp && latestEmp.code) {
        const numPart = latestEmp.code.replace(prefix, '');
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed)) {
          nextNum = parsed + 1;
        }
      }

      finalCode = `${prefix}${nextNum.toString().padStart(3, '0')}`;
    }

    const existing = await this.prisma.employee.findFirst({
      where: { OR: [{ email: dto.email }, { code: finalCode }] },
    });
    if (existing) throw new ConflictException('Employee with this email or code already exists');

    const designation = await this.prisma.designation.findUnique({ where: { id: dto.designationId } });
    if (!designation) throw new NotFoundException('Designation not found');

    return this.prisma.employee.create({
      data: {
        ...dto,
        code: finalCode,
        salary: dto.salary ?? designation.basicPay,
        photo: photoPath ?? dto.photo ?? null,
        appointmentType: dto.appointmentType as any,
        dateOfBirth: new Date(dto.dateOfBirth),
        joiningDate: new Date(dto.joiningDate),
      },
      include: EMPLOYEE_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateEmployeeDto, user: any, photoPath?: string) {
    const targetEmp = await this.findOne(id);

    if (user.role === 'SUPERVISOR') {
      if (!user.employeeId) throw new ForbiddenException('Supervisor not linked to an employee');
      const supervisorEmp = await this.prisma.employee.findUnique({ where: { id: user.employeeId } });
      if (!supervisorEmp || supervisorEmp.departmentId !== targetEmp.departmentId) {
        throw new ForbiddenException('You can only edit employees within your department');
      }
    }

    const data: any = { ...dto };
    if (dto.designationId && dto.salary === undefined) {
      const designation = await this.prisma.designation.findUnique({ where: { id: dto.designationId } });
      if (!designation) throw new NotFoundException('Designation not found');
      data.salary = designation.basicPay;
    }
    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.joiningDate) data.joiningDate = new Date(dto.joiningDate);
    if (photoPath) data.photo = photoPath;

    return this.prisma.employee.update({ where: { id }, data, include: EMPLOYEE_INCLUDE });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.employee.update({
      where: { id },
      data: { status: 'TERMINATED' },
    });
  }

  async getStats() {
    const [total, active, leave, off, serviceBreak, expired, resigned, terminated] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { status: 'LEAVE' } }),
      this.prisma.employee.count({ where: { status: 'OFF' } }),
      this.prisma.employee.count({ where: { status: 'SERVICE_BREAK' } }),
      this.prisma.employee.count({ where: { status: 'EXPIRED' } }),
      this.prisma.employee.count({ where: { status: 'RESIGNED' } }),
      this.prisma.employee.count({ where: { status: 'TERMINATED' } }),
    ]);
    return { total, active, leave, off, serviceBreak, expired, resigned, terminated };
  }

  private assertCanView(employee: any, user: any) {
    if (user?.role === 'EMPLOYEE' && user.employeeId !== employee.id) {
      throw new ForbiddenException('Employees can only access their own profile');
    }
    if (user?.role === 'SUPERVISOR' && employee.supervisorId !== user.employeeId && employee.id !== user.employeeId) {
      throw new ForbiddenException('Supervisors can only access their assigned employees');
    }
  }
}
