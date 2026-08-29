import {
  Injectable, NotFoundException, ConflictException, ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto, QueryEmployeeDto } from './dto/employee.dto';
import { paginate } from '../../common/dto/pagination.dto';

const EMPLOYEE_INCLUDE = {
  department: { select: { id: true, name: true, code: true } },
  designation: { select: { id: true, name: true, code: true } },
};

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryEmployeeDto) {
    const { search, departmentId, designationId, status, page = 1, limit = 10 } = query;
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
    if (designationId) where.designationId = designationId;
    if (status) where.status = status;

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
          include: { department: true, designation: true },
          orderBy: { createdAt: 'desc' },
        },
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        payrolls: { orderBy: { createdAt: 'desc' }, take: 12 },
        serviceBreaks: { orderBy: { breakStartDate: 'desc' } },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(dto: CreateEmployeeDto, photoPath?: string) {
    let finalCode = dto.code;

    if (!finalCode) {
      // Auto-generate code
      const prefixSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'EMP_CODE_PREFIX' }
      });
      const prefix = prefixSetting?.value || 'EMP-';

      // Find the latest employee code starting with the prefix
      const latestEmp = await this.prisma.employee.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' }, // This assumes padded numbers like EMP-001, EMP-002
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

    return this.prisma.employee.create({
      data: {
        ...dto,
        code: finalCode,
        photo: photoPath ?? null,
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
    const [total, active, inactive, terminated] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { status: 'INACTIVE' } }),
      this.prisma.employee.count({ where: { status: 'TERMINATED' } }),
    ]);
    return { total, active, inactive, terminated };
  }
}
