/**
 * Seed script for Supabase PostgreSQL
 *
 * Run with: npm run prisma:seed
 * Uses DIRECT_URL (port 5432) via the prisma directUrl config in schema.prisma
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('\n🌱 Seeding database...\n');

  // ── Departments ──────────────────────────────────────────
  const departments = await Promise.all([
    prisma.department.upsert({ where: { code: 'CARD' }, update: {}, create: { name: 'Cardiology', code: 'CARD' } }),
    prisma.department.upsert({ where: { code: 'NEUR' }, update: {}, create: { name: 'Neurology', code: 'NEUR' } }),
    prisma.department.upsert({ where: { code: 'ORTH' }, update: {}, create: { name: 'Orthopedics', code: 'ORTH' } }),
    prisma.department.upsert({ where: { code: 'PEDI' }, update: {}, create: { name: 'Pediatrics', code: 'PEDI' } }),
    prisma.department.upsert({ where: { code: 'NURS' }, update: {}, create: { name: 'Nursing', code: 'NURS' } }),
    prisma.department.upsert({ where: { code: 'ADM'  }, update: {}, create: { name: 'Administration', code: 'ADM' } }),
  ]);
  console.log(`✅ ${departments.length} departments seeded`);

  // ── Sections ─────────────────────────────────────────────
  const sections = await Promise.all([
    prisma.section.upsert({ where: { code: 'ICU' }, update: {}, create: { name: 'Intensive Care Unit', code: 'ICU', departmentId: departments[0].id } }),
    prisma.section.upsert({ where: { code: 'OPD' }, update: {}, create: { name: 'Outpatient Department', code: 'OPD', departmentId: departments[0].id } }),
    prisma.section.upsert({ where: { code: 'GEN' }, update: {}, create: { name: 'General Ward', code: 'GEN', departmentId: departments[4].id } }),
  ]);
  console.log(`✅ ${sections.length} sections seeded`);

  // ── Designations ─────────────────────────────────────────
  const designations = await Promise.all([
    prisma.designation.upsert({ where: { code: 'DOC' }, update: {}, create: { name: 'Doctor', code: 'DOC', payType: 'MONTHLY', basicPay: 120000, weightage: 15000, allowance: 10000, otRate: 500 } }),
    prisma.designation.upsert({ where: { code: 'SR_DOC' }, update: {}, create: { name: 'Senior Doctor', code: 'SR_DOC', payType: 'MONTHLY', basicPay: 150000, weightage: 20000, allowance: 15000, otRate: 700 } }),
    prisma.designation.upsert({ where: { code: 'NURSE' }, update: {}, create: { name: 'Nurse', code: 'NURSE', payType: 'MONTHLY', basicPay: 35000, weightage: 5000, allowance: 5000, otRate: 200 } }),
    prisma.designation.upsert({ where: { code: 'HD_NURS' }, update: {}, create: { name: 'Head Nurse', code: 'HD_NURS', payType: 'MONTHLY', basicPay: 50000, weightage: 7500, allowance: 7500, otRate: 300 } }),
    prisma.designation.upsert({ where: { code: 'TECH' }, update: {}, create: { name: 'Lab Technician', code: 'TECH', payType: 'DAILY', basicPay: 1200, weightage: 200, allowance: 100, otRate: 150 } }),
    prisma.designation.upsert({ where: { code: 'ADMIN' }, update: {}, create: { name: 'Admin Officer', code: 'ADMIN', payType: 'MONTHLY', basicPay: 40000, weightage: 5000, allowance: 5000, otRate: 250 } }),
  ]);
  console.log(`✅ ${designations.length} designations seeded`);

  // ── Users for all roles ───────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const superPassword = await bcrypt.hash('super123', 10);
  const empPassword   = await bcrypt.hash('emp123',   10);

  await prisma.user.upsert({
    where: { phone: '+919999999990' },
    update: {},
    create: { name: 'System Admin', phone: '+919999999990', email: 'admin@hospital.in', password: adminPassword, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { phone: '+919999999991' },
    update: {},
    create: { name: 'Establishment Officer', phone: '+919999999991', email: 'establishment@hospital.in', password: adminPassword, role: 'ESTABLISHMENT_OFFICER' },
  });
  await prisma.user.upsert({
    where: { phone: '+919999999992' },
    update: {},
    create: { name: 'Payroll Officer', phone: '+919999999992', email: 'payroll@hospital.in', password: adminPassword, role: 'PAYROLL_OFFICER' },
  });
  await prisma.user.upsert({
    where: { phone: '+919999999993' },
    update: {},
    create: { name: 'Hospital Management', phone: '+919999999993', email: 'management@hospital.in', password: adminPassword, role: 'MANAGEMENT' },
  });
  await prisma.user.upsert({
    where: { phone: '+919999999994' },
    update: {},
    create: { name: 'Dr. Anil Kumar', phone: '+919999999994', email: 'supervisor@hospital.in', password: superPassword, role: 'SUPERVISOR' },
  });
  console.log('✅ Role-based users seeded');

  // ── Employees ─────────────────────────────────────────────
  const emp1 = await prisma.employee.upsert({
    where: { code: 'EMP-001' },
    update: {},
    create: {
      code: 'EMP-001',
      name: 'Dr. Ramesh Sharma',
      address: 'Andheri West, Mumbai, Maharashtra, India',
      phone: '+919876543210',
      email: 'ramesh@hospital.in',
      gender: 'MALE',
      dateOfBirth: new Date('1985-05-15'),
      bankName: 'State Bank of India',
      accountNumber: '12345678901',
      ifscCode: 'SBIN0001234',
      panNumber: 'ABCDE1234F',
      appointmentType: 'ONE_YEAR',
      departmentId: departments[0].id,
      sectionId: sections[0].id,
      designationId: designations[1].id,
      salary: 150000,
      joiningDate: new Date('2020-01-15'),
      status: 'ACTIVE',
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { code: 'EMP-002' },
    update: {},
    create: {
      code: 'EMP-002',
      name: 'Priya Desai',
      address: 'Borivali East, Mumbai, Maharashtra, India',
      phone: '+919876543211',
      email: 'priya@hospital.in',
      gender: 'FEMALE',
      dateOfBirth: new Date('1992-08-22'),
      bankName: 'HDFC Bank',
      accountNumber: '98765432109',
      ifscCode: 'HDFC0005678',
      appointmentType: 'DAYS_178',
      departmentId: departments[4].id,
      sectionId: sections[2].id,
      designationId: designations[2].id,
      salary: 45000,
      joiningDate: new Date('2024-03-01'),
      status: 'ACTIVE',
    },
  });

  const emp3 = await prisma.employee.upsert({
    where: { code: 'EMP-003' },
    update: {},
    create: {
      code: 'EMP-003',
      name: 'Rajesh Singh',
      address: 'Thane West, Maharashtra, India',
      phone: '+919876543212',
      email: 'rajesh@hospital.in',
      gender: 'MALE',
      dateOfBirth: new Date('1990-11-10'),
      bankName: 'ICICI Bank',
      accountNumber: '45678901234',
      ifscCode: 'ICIC0004321',
      appointmentType: 'DAYS_89',
      departmentId: departments[2].id,
      designationId: designations[0].id,
      salary: 120000,
      joiningDate: new Date('2025-06-01'),
      status: 'ACTIVE',
    },
  });
  console.log('✅ 3 sample employees seeded');

  // Link emp1 user
  await prisma.user.upsert({
    where: { phone: emp1.phone },
    update: {},
    create: {
      name: emp1.name,
      phone: emp1.phone,
      email: emp1.email,
      password: empPassword,
      role: 'EMPLOYEE',
      employeeId: emp1.id,
    },
  });

  // ── Appointments ──────────────────────────────────────────
  await prisma.appointment.upsert({
    where: { orderNumber: 'APT-2024-001' },
    update: {},
    create: {
      orderNumber: 'APT-2024-001',
      orderDate: new Date('2024-01-10'),
      employeeId: emp1.id,
      contractType: 'ONE_YEAR',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-01-14'),
      salary: 150000,
      designationId: designations[1].id,
      departmentId: departments[0].id,
      sectionId: sections[0].id,
      termsAndConditions: 'Standard employment terms apply.',
      status: 'ACTIVE',
    },
  });

  await prisma.appointment.upsert({
    where: { orderNumber: 'APT-2024-002' },
    update: {},
    create: {
      orderNumber: 'APT-2024-002',
      orderDate: new Date('2024-02-25'),
      employeeId: emp2.id,
      contractType: 'DAYS_178',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-08-25'),
      salary: 45000,
      designationId: designations[2].id,
      departmentId: departments[4].id,
      sectionId: sections[2].id,
      serviceBreakApplicable: true,
      breakDueDate: new Date('2024-08-26'),
      termsAndConditions: '178 days contract with service break applicability.',
      status: 'EXPIRED',
    },
  });

  await prisma.appointment.upsert({
    where: { orderNumber: 'APT-2025-001' },
    update: {},
    create: {
      orderNumber: 'APT-2025-001',
      orderDate: new Date('2025-05-25'),
      employeeId: emp3.id,
      contractType: 'DAYS_89',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-08-28'),
      salary: 120000,
      designationId: designations[0].id,
      departmentId: departments[2].id,
      termsAndConditions: '89 days temporary appointment.',
      status: 'ACTIVE',
    },
  });
  console.log('✅ 3 sample appointments seeded');

  // ── System Settings ───────────────────────────────────────
  const settings = [
    { key: '89_days_duration', value: '89', description: 'Duration in days for 89-day contract type' },
    { key: '178_days_duration', value: '178', description: 'Duration in days for 178-day contract type' },
    { key: 'one_year_duration', value: '365', description: 'Duration in days for 1-year contract type' },
    { key: 'alert_lead_days', value: '60,30,15,7', description: 'Lead days for system expiry and milestone alerts' },
    { key: 'service_break_default_days', value: '10', description: 'Default service break duration in days' },
    { key: 'ot_rate_multiplier', value: '1.5', description: 'Overtime hourly rate multiplier' },
    { key: 'allowance_standard_housing', value: '500', description: 'Standard housing allowance amount' },
    { key: 'allowance_standard_transport', value: '200', description: 'Standard transport allowance amount' },
    { key: 'EMP_CODE_PREFIX', value: 'EMP-', description: 'Prefix for auto-generated employee codes' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`✅ ${settings.length} system settings seeded`);

  console.log('\n🎉 Seed complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
