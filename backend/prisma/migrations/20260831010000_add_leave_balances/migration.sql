CREATE TABLE "leave_balances" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "paidOff" INTEGER NOT NULL DEFAULT 0,
  "festival" INTEGER NOT NULL DEFAULT 0,
  "other" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "leave_balances_employeeId_key" ON "leave_balances"("employeeId");
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
