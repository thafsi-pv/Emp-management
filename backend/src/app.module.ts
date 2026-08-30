import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './auth/guards/roles.guard';
import { StorageModule } from './common/services/storage.module';

import { DepartmentsModule } from './modules/departments/departments.module';
import { SectionsModule } from './modules/sections/sections.module';
import { DesignationsModule } from './modules/designations/designations.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { ServiceBreakModule } from './modules/service-break/service-break.module';
import { ContractRenewalModule } from './modules/contract-renewal/contract-renewal.module';
import { ContractTerminationModule } from './modules/contract-termination/contract-termination.module';
import { PayStructuresModule } from './modules/pay-structures/pay-structures.module';
import { FinalSettlementModule } from './modules/final-settlement/final-settlement.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { DocumentsModule } from './modules/documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    StorageModule,
    DepartmentsModule,
    SectionsModule,
    DesignationsModule,
    EmployeesModule,
    AppointmentsModule,
    AttendanceModule,
    LeavesModule,
    PayrollModule,
    ServiceBreakModule,
    ContractRenewalModule,
    ContractTerminationModule,
    PayStructuresModule,
    FinalSettlementModule,
    ReportsModule,
    SettingsModule,
    DocumentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
