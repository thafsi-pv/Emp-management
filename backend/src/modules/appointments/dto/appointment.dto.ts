import {
  IsString, IsEnum, IsDateString, IsNumber, IsPositive, IsOptional, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateAppointmentDto {
  @IsOptional() @IsString() orderNumber?: string;
  @IsOptional() @IsDateString() orderDate?: string;
  @IsString() employeeId: string;
  @IsEnum(['DAYS_89', 'DAYS_178', 'ONE_YEAR', 'EXTENSION', 'THREE_MONTHS', 'SIX_MONTHS', 'CUSTOM']) contractType: string;
  @IsDateString() startDate: string;
  @IsOptional() @IsDateString() endDate?: string;
  @Type(() => Number) @IsNumber() @IsPositive() salary: number;
  @IsString() designationId: string;
  @IsString() departmentId: string;
  @IsOptional() @IsString() sectionId?: string;
  @IsOptional() @IsString() termsAndConditions?: string;
  @IsOptional() @IsString() joiningReportUrl?: string;
  @IsOptional() @IsString() agreementUrl?: string;
  @IsOptional() @IsString() appointmentPdfUrl?: string;
  @IsOptional() @IsString() previousAppointmentId?: string;
  @IsOptional() @IsBoolean() serviceBreakApplicable?: boolean;
  @IsOptional() @IsDateString() breakDueDate?: string;
}

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}

export class QueryAppointmentDto {
  @IsOptional() @IsString() employeeId?: string;
  @IsOptional() @IsString() contractType?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 100;
  @IsOptional() @Type(() => Number) expiringDays?: number;
}
