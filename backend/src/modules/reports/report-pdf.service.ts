import { Injectable } from '@nestjs/common';
import { Response } from 'express';
const PDFDocument = require('pdfkit');

@Injectable()
export class ReportPdfService {
  generate(type: string, report: any, res: Response) {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 32 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.pdf`); doc.pipe(res);
    const rows = Array.isArray(report) ? report : report?.data || report?.employees || report?.records || report?.payrolls || report?.appointments || [];
    const columns = type === 'payroll' ? [['Employee', 'employee.name', 160], ['Code', 'employee.code', 80], ['Month', 'month', 60], ['Year', 'year', 50], ['Basic', 'basicSalary', 90], ['Net Pay', 'netSalary', 100], ['Status', 'status', 80]] : type === 'attendance' ? [['Employee', 'employee.name', 180], ['Code', 'employee.code', 80], ['Date', 'date', 100], ['Status', 'status', 100], ['Approval', 'approvalStatus', 110]] : [['Code', 'code', 80], ['Employee', 'name', 170], ['Department', 'department.name', 150], ['Designation', 'designation.name', 150], ['Status', 'status', 90]];
    const drawHeader = () => { doc.font('Helvetica-Bold').fontSize(16).text(`${type.replaceAll('-', ' ').toUpperCase()} REPORT`, { align: 'center' }); doc.font('Helvetica').fontSize(8).text(`Generated ${new Date().toLocaleString()} • ${rows.length} record(s)`, { align: 'center' }).moveDown(.7); let x = 32; const y = doc.y; doc.fillColor('#e5e7eb').rect(x, y, 728, 18).fill(); doc.fillColor('#111827').font('Helvetica-Bold').fontSize(7); columns.forEach(([label, , width]: any) => { doc.text(label, x + 4, y + 5, { width: width - 8 }); x += width; }); doc.y = y + 21; };
    drawHeader();
    if (!rows.length) doc.fontSize(10).text('No records found for the selected report.');
    rows.forEach((row: any, index: number) => { const values = columns.map(([, path]: any) => { const v = path.split('.').reduce((a: any, k: string) => a?.[k], row); return v === undefined || v === null ? '—' : typeof v === 'number' ? v.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : String(v).replace('T00:00:00.000Z', ''); }); const height = Math.max(20, ...values.map((v: string, i: number) => doc.heightOfString(v, { width: Number(columns[i][2]) - 8, fontSize: 7 }) + 8)); if (doc.y + height > 560) { doc.addPage(); drawHeader(); } let x = 32; const y = doc.y; if (index % 2 === 0) doc.fillColor('#f8fafc').rect(x, y, 728, height).fill(); doc.fillColor('#1f2937').font('Helvetica').fontSize(7); columns.forEach(([, , width]: any, i: number) => { doc.text(values[i], x + 4, y + 4, { width: Number(width) - 8, height: height - 6, ellipsis: true }); x += Number(width); }); doc.y = y + height; });
    doc.end();
  }
}
