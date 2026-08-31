import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(departmentId?: string) {
    const where = departmentId ? { departmentId } : {};
    return this.prisma.section.findMany({
      where,
      include: { department: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: { department: true, employees: true },
    });
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async findEmployees(id: string, user: any) {
    const section = await this.findOne(id);
    if (user?.role === 'SUPERVISOR') {
      const supervisor = await this.prisma.employee.findUnique({ where: { id: user.employeeId } });
      if (!supervisor || supervisor.sectionId !== section.id) {
        throw new ForbiddenException('Supervisors can only access their own section roster');
      }
    }
    return this.prisma.employee.findMany({
      where: { sectionId: id },
      include: { designation: { select: { name: true } }, supervisor: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateSectionDto) {
    return this.prisma.section.create({
      data: dto,
      include: { department: true },
    });
  }

  async update(id: string, dto: UpdateSectionDto) {
    await this.findOne(id);
    return this.prisma.section.update({
      where: { id },
      data: dto,
      include: { department: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.section.delete({ where: { id } });
  }
}
