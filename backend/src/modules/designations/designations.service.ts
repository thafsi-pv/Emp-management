import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/designation.dto';

@Injectable()
export class DesignationsService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.designation.findMany({ orderBy: { name: 'asc' } }); }

  async findOne(id: string) {
    const d = await this.prisma.designation.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Designation not found');
    return d;
  }

  async create(dto: CreateDesignationDto) {
    const existing = await this.prisma.designation.findFirst({
      where: { OR: [{ name: dto.name }, { code: dto.code }] },
    });
    if (existing) throw new ConflictException('Designation name or code already exists');
    return this.prisma.designation.create({ data: dto });
  }

  async update(id: string, dto: UpdateDesignationDto) {
    await this.findOne(id);
    return this.prisma.designation.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.designation.delete({ where: { id } });
  }
}
