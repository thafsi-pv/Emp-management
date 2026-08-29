import {
  IsString, IsEnum, IsDateString, IsNumber, IsPositive, IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateAppointmentDto {
  @IsString() employeeId: string;
  @IsEnum(['THREE_MONTHS', 'SIX_MONTHS', 'ONE_YEAR', 'CUSTOM']) contractType: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @Type(() => Number) @IsNumber() @IsPositive() salary: number;
  @IsString() designationId: string;
  @IsString() departmentId: string;
  @IsString() termsAndConditions: string;
}

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}

export class QueryAppointmentDto {
  @IsOptional() @IsString() employeeId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 10;
  @IsOptional() @Type(() => Number) expiringDays?: number;
}
