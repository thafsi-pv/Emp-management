import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async findAllForEmployee(employeeId: string, user?: any) {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    if (user?.role === 'EMPLOYEE' && user.employeeId !== employeeId) {
      throw new ForbiddenException('Employees can only access their own documents');
    }
    if (user?.role === 'SUPERVISOR' && employee.supervisorId !== user.employeeId && employee.id !== user.employeeId) {
      throw new ForbiddenException('Supervisors can only access their assigned employees documents');
    }

    return this.prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async create(employeeId: string, name: string, fileUrl: string, fileType: string, category?: string) {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const categoryMap: Record<string, string> = {
      'Application': 'APPLICATION', 'Photo': 'PHOTO', 'ID/Aadhaar': 'ID_AADHAAR',
      'Appointment Order': 'APPOINTMENT', 'Joining Report': 'JOINING', 'Agreement': 'AGREEMENT',
      'ID Card': 'ID_CARD', 'Bank Details': 'BANK', 'Leave Documents': 'LEAVE',
      'Service Break Order': 'SERVICE_BREAK', 'Extension Order': 'EXTENSION', 'Renewal Order': 'RENEWAL',
      'Pay Revision Order': 'PAY_REVISION', 'Memo/Warning': 'MEMO_WARNING', 'Resignation': 'RESIGNATION',
      'Termination Order': 'TERMINATION', 'Final Settlement': 'FINAL_SETTLEMENT',
    };
    return this.prisma.employeeDocument.create({
      data: {
        employeeId,
        name,
        fileUrl,
        fileType,
        category: (categoryMap[category || name] || 'OTHER') as any,
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
