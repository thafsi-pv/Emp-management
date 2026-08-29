import { IsString, IsEnum, IsDateString, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateContractRenewalDto {
  @IsString() appointmentId: string;
  @IsDateString() newStartDate: string;
  @IsDateString() newEndDate: string;
  @IsEnum(['THREE_MONTHS', 'SIX_MONTHS', 'ONE_YEAR', 'CUSTOM']) contractType: string;
  @Type(() => Number) @IsNumber() @IsPositive() salary: number;
}

export class QueryContractRenewalDto {
  @IsOptional() @IsString() employeeId?: string;
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 10;
}
