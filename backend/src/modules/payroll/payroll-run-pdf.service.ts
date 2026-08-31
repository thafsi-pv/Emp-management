import { Injectable } from '@nestjs/common';
import { Response } from 'express';
const PDFDocument = require('pdfkit');

@Injectable()
export class PayrollRunPdfService {
  register(run: any, res: Response) { this.render(run, res, 'PAYROLL REGISTER', 'payroll-register'); }
  bankStatement(run: any, res: Response) { this.render(run, res, 'BANK PAYMENT STATEMENT', 'bank-statement'); }
  private render(run: any, res: Response, title: string, prefix: string) {
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename=${prefix}-${run.month}-${run.year}.pdf`); doc.pipe(res);
    doc.font('Helvetica-Bold').fontSize(17).text(title, { align: 'center' }); doc.font('Helvetica').fontSize(10).text(`Period: ${String(run.month).padStart(2, '0')}/${run.year}`, { align: 'center' }).moveDown();
    (run.entries || []).forEach((entry: any, i: number) => { if (doc.y > 740) doc.addPage(); const employee = entry.employee || {}; const line = title === 'BANK PAYMENT STATEMENT' ? `${i + 1}. ${employee.name} (${employee.code}) — ${employee.bankName || 'Bank not provided'} / ${employee.accountNumber || 'Account not provided'} — ₹ ${entry.netPay.toFixed(2)}` : `${i + 1}. ${employee.name} (${employee.code}) — Present: ${entry.presentDays}, Basic: ₹ ${entry.basicPay.toFixed(2)}, Net: ₹ ${entry.netPay.toFixed(2)}`; doc.text(line).moveDown(.25); });
    doc.moveDown().font('Helvetica-Bold').text(`Total Net Pay: ₹ ${(run.entries || []).reduce((sum: number, row: any) => sum + row.netPay, 0).toFixed(2)}`); doc.end();
  }
}
