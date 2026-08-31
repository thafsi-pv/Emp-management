CREATE TYPE "ServiceBreakStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED');
CREATE TYPE "SeparationType" AS ENUM ('RESIGNATION', 'TERMINATION');

ALTER TABLE "service_breaks" ADD COLUMN "appointmentId" TEXT;
ALTER TABLE "service_breaks" ADD COLUMN "applicable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "service_breaks" ADD COLUMN "day178Date" TIMESTAMP(3);
ALTER TABLE "service_breaks" ADD COLUMN "breakDueDate" TIMESTAMP(3);
ALTER TABLE "service_breaks" ADD COLUMN "status" "ServiceBreakStatus" NOT NULL DEFAULT 'PENDING';
CREATE UNIQUE INDEX "service_breaks_appointmentId_key" ON "service_breaks"("appointmentId");
ALTER TABLE "service_breaks" ADD CONSTRAINT "service_breaks_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "payroll_runs" (
  "id" TEXT NOT NULL, "month" INTEGER NOT NULL, "year" INTEGER NOT NULL,
  "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payroll_runs_month_year_key" ON "payroll_runs"("month", "year");
CREATE TABLE "payroll_entries" (
  "id" TEXT NOT NULL, "payrollRunId" TEXT NOT NULL, "employeeId" TEXT NOT NULL,
  "basicPay" DOUBLE PRECISION NOT NULL, "weightage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "presentDays" DOUBLE PRECISION NOT NULL DEFAULT 0, "paidOffDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "leaveDays" DOUBLE PRECISION NOT NULL DEFAULT 0, "absentDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "serviceBreakDays" DOUBLE PRECISION NOT NULL DEFAULT 0, "overtime" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "allowance" DOUBLE PRECISION NOT NULL DEFAULT 0, "deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "advance" DOUBLE PRECISION NOT NULL DEFAULT 0, "netPay" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payroll_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payroll_entries_payrollRunId_employeeId_key" ON "payroll_entries"("payrollRunId", "employeeId");
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_entries" ADD CONSTRAINT "payroll_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "separations" (
  "id" TEXT NOT NULL, "employeeId" TEXT NOT NULL, "type" "SeparationType" NOT NULL, "reason" TEXT NOT NULL,
  "effectiveDate" TIMESTAMP(3) NOT NULL, "noticePeriod" INTEGER, "clearanceDone" BOOLEAN NOT NULL DEFAULT false,
  "idCardReturned" BOOLEAN NOT NULL DEFAULT false, "propertyReturned" BOOLEAN NOT NULL DEFAULT false, "orderPdfUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "separations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "separations_employeeId_key" ON "separations"("employeeId");
ALTER TABLE "separations" ADD CONSTRAINT "separations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
