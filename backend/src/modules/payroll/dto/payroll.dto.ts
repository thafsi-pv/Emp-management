import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class GeneratePayrollDto {
  @IsString() employeeId: string;
  @IsString() month: string;        // "01" - "12"
  @Type(() => Number) @IsNumber() year: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) allowance?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) bonus?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) gratuity?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) deduction?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) overtime?: number;
}

export class QueryPayrollDto {
  @IsOptional() @IsString() employeeId?: string;
  @IsOptional() @IsString() month?: string;
  @IsOptional() @Type(() => Number) year?: number;
  @IsOptional() @IsEnum(['DRAFT', 'APPROVED', 'PAID']) status?: string;
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 10;
}
