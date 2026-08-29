import { Injectable } from '@nestjs/common';
import { Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import { format } from 'date-fns';

@Injectable()
export class AppointmentPdfService {
  generateAppointmentPdf(appointment: any, res: Response) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=appointment-${appointment.orderNumber}.pdf`,
    );
    doc.pipe(res);

    // Header
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('APPOINTMENT ORDER', { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Order Number: ${appointment.orderNumber}`, { align: 'center' })
      .text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, { align: 'center' })
      .moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(0.8);

    // To section
    doc.fontSize(11).font('Helvetica-Bold').text('To,').font('Helvetica');
    doc.text(appointment.employee.name);
    doc.moveDown(1);

    // Subject
    doc
      .font('Helvetica-Bold')
      .text('Subject: Letter of Appointment', { underline: true })
      .moveDown(0.8);

    // Body
    doc.font('Helvetica').fontSize(11).text(
      `Dear ${appointment.employee.name},`,
    ).moveDown(0.5);

    doc.text(
      `We are pleased to appoint you as ${appointment.designation?.name} in the ${appointment.department?.name} department, ` +
      `effective from ${format(new Date(appointment.startDate), 'dd MMM yyyy')} to ${format(new Date(appointment.endDate), 'dd MMM yyyy')}.`,
      { align: 'justify' },
    ).moveDown(0.8);

    // Details table
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 250;

    const rows = [
      ['Designation', appointment.designation?.name ?? '—'],
      ['Department', appointment.department?.name ?? '—'],
      ['Contract Type', appointment.contractType.replace(/_/g, ' ')],
      ['Start Date', format(new Date(appointment.startDate), 'dd MMM yyyy')],
      ['End Date', format(new Date(appointment.endDate), 'dd MMM yyyy')],
      ['Monthly Salary', `AED ${Number(appointment.salary).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`],
    ];

    rows.forEach(([label, value], i) => {
      const y = tableTop + i * 22;
      doc
        .font('Helvetica-Bold').fontSize(10).text(label, col1, y)
        .font('Helvetica').text(value, col2, y);
    });

    doc.moveDown(rows.length + 0.5);

    // Terms
    doc
      .font('Helvetica-Bold').text('Terms and Conditions:').moveDown(0.4)
      .font('Helvetica').fontSize(10)
      .text(appointment.termsAndConditions, { align: 'justify' })
      .moveDown(2);

    // Signature
    doc
      .font('Helvetica-Bold').fontSize(11)
      .text('Authorized Signatory', { align: 'right' })
      .moveDown(0.3)
      .font('Helvetica')
      .text('HR Department', { align: 'right' });

    doc.end();
  }
}
