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
      // Seed always uses the direct URL (not pooled) for reliable inserts
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('\n🌱 Seeding Supabase database...\n');

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

  // ── Designations ─────────────────────────────────────────
  const designations = await Promise.all([
    prisma.designation.upsert({ where: { code: 'DOC'     }, update: {}, create: { name: 'Doctor', code: 'DOC' } }),
    prisma.designation.upsert({ where: { code: 'SR_DOC'  }, update: {}, create: { name: 'Senior Doctor', code: 'SR_DOC' } }),
    prisma.designation.upsert({ where: { code: 'NURSE'   }, update: {}, create: { name: 'Nurse', code: 'NURSE' } }),
    prisma.designation.upsert({ where: { code: 'HD_NURS' }, update: {}, create: { name: 'Head Nurse', code: 'HD_NURS' } }),
    prisma.designation.upsert({ where: { code: 'TECH'    }, update: {}, create: { name: 'Lab Technician', code: 'TECH' } }),
    prisma.designation.upsert({ where: { code: 'ADMIN'   }, update: {}, create: { name: 'Admin Officer', code: 'ADMIN' } }),
  ]);
  console.log(`✅ ${designations.length} designations seeded`);

  // ── Users ─────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const superPassword = await bcrypt.hash('super123', 10);
  const empPassword   = await bcrypt.hash('emp123',   10);

  await prisma.user.upsert({
    where: { email: 'admin@hospital.in' },
    update: {},
    create: { name: 'Hospital Admin', email: 'admin@hospital.in', password: adminPassword, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'supervisor@hospital.in' },
    update: {},
    create: { name: 'Dr. Anil Kumar', email: 'supervisor@hospital.in', password: superPassword, role: 'SUPERVISOR' },
  });
  console.log('✅ Admin and Supervisor users seeded');

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
      departmentId: departments[0].id,
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
      departmentId: departments[4].id,
      designationId: designations[2].id,
      salary: 45000,
      joiningDate: new Date('2021-03-01'),
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
      departmentId: departments[2].id,
      designationId: designations[0].id,
      salary: 120000,
      joiningDate: new Date('2022-06-01'),
      status: 'ACTIVE',
    },
  });
  console.log('✅ 3 sample employees seeded');

  // Link emp1 to an EMPLOYEE user
  await prisma.user.upsert({
    where: { email: 'ramesh@hospital.in' },
    update: {},
    create: {
      name: emp1.name,
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
      employeeId: emp1.id,
      contractType: 'ONE_YEAR',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-01-14'),
      salary: 150000,
      designationId: designations[1].id,
      departmentId: departments[0].id,
      termsAndConditions:
        'Standard employment terms apply. Employee is entitled to 30 days annual leave, ' +
        'medical insurance, and all statutory benefits as per Indian Labour Laws.',
      status: 'ACTIVE',
    },
  });

  await prisma.appointment.upsert({
    where: { orderNumber: 'APT-2024-002' },
    update: {},
    create: {
      orderNumber: 'APT-2024-002',
      employeeId: emp2.id,
      contractType: 'SIX_MONTHS',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-08-31'),
      salary: 45000,
      designationId: designations[2].id,
      departmentId: departments[4].id,
      termsAndConditions:
        'Standard employment terms apply. Employee is entitled to pro-rated leave ' +
        'and benefits as per Indian Labour Laws.',
      status: 'EXPIRED',
    },
  });

  await prisma.appointment.upsert({
    where: { orderNumber: 'APT-2025-001' },
    update: {},
    create: {
      orderNumber: 'APT-2025-001',
      employeeId: emp3.id,
      contractType: 'ONE_YEAR',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-05-31'),
      salary: 120000,
      designationId: designations[0].id,
      departmentId: departments[2].id,
      termsAndConditions:
        'Standard employment terms apply. All Indian Labour Laws entitlements apply.',
      status: 'ACTIVE',
    },
  });
  console.log('✅ 3 sample appointments seeded');

  // ── Attendance (today) ────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const [emp, status] of [[emp1, 'PRESENT'], [emp2, 'ABSENT'], [emp3, 'PRESENT']] as const) {
    await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: emp.id, date: today } },
      update: {},
      create: {
        employeeId: emp.id,
        date: today,
        status,
        approvalStatus: 'APPROVED',
      },
    });
  }
  console.log('✅ Today\'s attendance seeded');

  // -- System Settings (Master Settings) --------------------
  const settings = [
    { key: '89_days_threshold', value: '89', description: 'Alert threshold for 89 days contract expiry' },
    { key: '178_days_threshold', value: '178', description: 'Alert threshold for 178 days contract completion' },
    { key: 'one_year_threshold', value: '365', description: 'Alert threshold for one year contract expiry' },
    { key: 'ot_rate_multiplier', value: '1.5', description: 'Overtime hourly rate multiplier' },
    { key: 'allowance_standard_housing', value: '500', description: 'Standard housing allowance amount' },
    { key: 'allowance_standard_transport', value: '200', description: 'Standard transport allowance amount' },
    { key: 'weightage_multiplier_engr', value: '1.25', description: 'Salary weightage multiplier for Engineers' },
    { key: 'weightage_multiplier_tech', value: '1.10', description: 'Salary weightage multiplier for Technicians' },
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

  console.log('\n🎉 Supabase seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('Admin:       admin@hospital.in      / admin123');
  console.log('Supervisor:  supervisor@hospital.in / super123');
  console.log('Employee:    ramesh@hospital.in     / emp123');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
