import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceBreakDto, UpdateServiceBreakDto, QueryServiceBreakDto } from './dto/service-break.dto';
import { paginate } from '../../common/dto/pagination.dto';

const INCLUDE = {
  employee: {
    select: {
      id: true, name: true, code: true,
      department: { select: { id: true, name: true } },
    },
  },
};

@Injectable()
export class ServiceBreakService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryServiceBreakDto) {
    const { employeeId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const [data, total] = await Promise.all([
      this.prisma.serviceBreak.findMany({
        where, include: INCLUDE, skip, take: limit,
        orderBy: { breakStartDate: 'desc' },
      }),
      this.prisma.serviceBreak.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const sb = await this.prisma.serviceBreak.findUnique({ where: { id }, include: INCLUDE });
    if (!sb) throw new NotFoundException('Service break not found');
    return sb;
  }

  async create(dto: CreateServiceBreakDto) {
    return this.prisma.serviceBreak.create({
      data: {
        ...dto,
        breakStartDate: new Date(dto.breakStartDate),
        breakEndDate: new Date(dto.breakEndDate),
      },
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateServiceBreakDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.breakStartDate) data.breakStartDate = new Date(dto.breakStartDate);
    if (dto.breakEndDate) data.breakEndDate = new Date(dto.breakEndDate);
    return this.prisma.serviceBreak.update({ where: { id }, data, include: INCLUDE });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.serviceBreak.delete({ where: { id } });
  }
}
