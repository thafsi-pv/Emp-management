import { Injectable } from '@nestjs/common';
import { Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import { format } from 'date-fns';

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Injectable()
export class PayrollPdfService {
  generatePayslip(payroll: any, res: Response) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=payslip-${payroll.employee.code}-${payroll.month}-${payroll.year}.pdf`,
    );
    doc.pipe(res);

    // Header bar
    doc.rect(50, 45, 495, 60).fill('#1e3a5f');
    doc
      .fillColor('white')
      .fontSize(20).font('Helvetica-Bold')
      .text('SALARY SLIP', 60, 55)
      .fontSize(11).font('Helvetica')
      .text(`${MONTHS[parseInt(payroll.month)]} ${payroll.year}`, 60, 78)
      .fillColor('black');

    doc.moveDown(4);

    // Employee info section
    doc.fontSize(10).font('Helvetica-Bold').text('EMPLOYEE DETAILS', 50, 125);
    doc.moveTo(50, 138).lineTo(545, 138).stroke('#cccccc');

    const empDetails = [
      ['Employee Name', payroll.employee.name],
      ['Employee Code', payroll.employee.code],
      ['Department', payroll.employee.department?.name ?? '—'],
      ['Designation', payroll.employee.designation?.name ?? '—'],
      ['Pay Period', `${MONTHS[parseInt(payroll.month)]} ${payroll.year}`],
    ];

    let y = 145;
    empDetails.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#666666').text(label, 55, y);
      doc.font('Helvetica').fontSize(9).fillColor('#111111').text(value, 200, y);
      y += 16;
    });

    // Attendance summary
    y += 10;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#111111').text('ATTENDANCE SUMMARY', 50, y);
    y += 13;
    doc.moveTo(50, y).lineTo(545, y).stroke('#cccccc');
    y += 7;

    const attDetails = [
      ['Total Working Days', String(payroll.totalWorkingDays)],
      ['Days Worked', String(payroll.workedDays)],
      ['Days Absent', String(Math.max(0, payroll.totalWorkingDays - payroll.workedDays))],
    ];

    attDetails.forEach(([label, value]) => {
      doc.font('Helvetica').fontSize(9).fillColor('#666666').text(label, 55, y);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#111111').text(value, 200, y);
      y += 15;
    });

    // Salary breakdown
    y += 10;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#111111').text('SALARY BREAKDOWN', 50, y);
    y += 13;
    doc.moveTo(50, y).lineTo(545, y).stroke('#cccccc');
    y += 7;

    // Two-column: earnings and deductions
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e3a5f')
      .text('EARNINGS', 55, y)
      .text('AMOUNT (AED)', 250, y)
      .text('DEDUCTIONS', 310, y)
      .text('AMOUNT (AED)', 490, y, { align: 'right' });

    y += 15;
    doc.moveTo(50, y).lineTo(545, y).stroke('#eeeeee');
    y += 5;

    const earned = [
      ['Basic Salary', payroll.basicSalary],
      ['Allowance', payroll.allowance],
      ['Bonus', payroll.bonus],
      ['Gratuity', payroll.gratuity],
      ['Overtime', payroll.overtime],
    ];

    const deducted = [
      ['Deductions', payroll.deduction],
    ];

    const maxRows = Math.max(earned.length, deducted.length);
    for (let i = 0; i < maxRows; i++) {
      const e = earned[i];
      const d = deducted[i];

      if (e) {
        doc.font('Helvetica').fontSize(9).fillColor('#333333')
          .text(e[0] as string, 55, y)
          .text(this.formatAED(e[1] as number), 250, y);
      }
      if (d) {
        doc.font('Helvetica').fontSize(9).fillColor('#333333')
          .text(d[0] as string, 310, y)
          .text(this.formatAED(d[1] as number), 490, y, { align: 'right' });
      }
      y += 15;
    }

    // Net salary box
    y += 15;
    doc.rect(50, y, 495, 40).fill('#1e3a5f');
    doc
      .fillColor('white')
      .fontSize(12).font('Helvetica-Bold')
      .text('NET SALARY', 60, y + 12)
      .text(`AED ${this.formatAED(payroll.netSalary)}`, 60, y + 12, { align: 'right', width: 475 });

    y += 65;
    doc.fillColor('#111111').font('Helvetica').fontSize(9)
      .text('This is a computer-generated payslip and does not require a signature.', 50, y, { align: 'center' });

    doc.end();
  }

  private formatAED(amount: number): string {
    return Number(amount).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
