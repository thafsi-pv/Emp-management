CREATE TYPE "AlertType" AS ENUM (
  'APPOINTMENT_EXPIRY',
  'SERVICE_BREAK_DUE',
  'PENDING_LEAVE',
  'PENDING_PAYROLL',
  'UNMARKED_ATTENDANCE'
);

CREATE TABLE "alert_queue" (
  "id" TEXT NOT NULL,
  "alertType" "AlertType" NOT NULL,
  "employeeId" TEXT,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "daysBefore" INTEGER NOT NULL,
  "recipientRole" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "alert_queue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "alert_queue_alertType_employeeId_dueDate_daysBefore_recipientRole_key"
  ON "alert_queue"("alertType", "employeeId", "dueDate", "daysBefore", "recipientRole");
CREATE INDEX "alert_queue_recipientRole_sentAt_idx" ON "alert_queue"("recipientRole", "sentAt");
ALTER TABLE "alert_queue" ADD CONSTRAINT "alert_queue_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
