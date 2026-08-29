import { IsString, IsDateString, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class CreateServiceBreakDto {
  @IsString() employeeId: string;
  @IsDateString() breakStartDate: string;
  @IsDateString() breakEndDate: string;
  @IsString() reason: string;
  @IsOptional() @IsString() remarks?: string;
}

export class UpdateServiceBreakDto extends PartialType(CreateServiceBreakDto) {}

export class QueryServiceBreakDto {
  @IsOptional() @IsString() employeeId?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 10;
}
