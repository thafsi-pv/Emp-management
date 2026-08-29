import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async findAllForEmployee(employeeId: string) {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async create(employeeId: string, name: string, fileUrl: string, fileType: string) {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.employeeDocument.create({
      data: {
        employeeId,
        name,
        fileUrl,
        fileType,
      },
    });
  }

  async remove(id: string) {
    const doc = await this.prisma.employeeDocument.findUnique({
      where: { id },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    // Attempt to delete physical file from disk
    const absolutePath = join(process.cwd(), doc.fileUrl);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.error(`Failed to delete file at ${absolutePath}:`, err);
      }
    }

    return this.prisma.employeeDocument.delete({
      where: { id },
    });
  }
}
