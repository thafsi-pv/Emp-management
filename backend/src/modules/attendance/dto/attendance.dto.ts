import { IsString, IsEnum, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttendanceDto {
  @IsString() employeeId: string;
  @IsDateString() date: string;
  @IsEnum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'OFF', 'OD', 'HOLIDAY', 'SERVICE_BREAK']) status: any;
  @IsOptional() @IsString() remarks?: string;
  @IsOptional() @IsBoolean() override?: boolean;
}

export class BulkAttendanceDto {
  records: CreateAttendanceDto[];
}

export class ApproveAttendanceDto {
  @IsOptional() @IsString() remarks?: string;
}

export class RejectAttendanceDto {
  @IsString() reason: string;
}

export class QueryAttendanceDto {
  @IsOptional() @IsString() employeeId?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() month?: string;
  @IsOptional() @Type(() => Number) year?: number;
  @IsOptional() @IsEnum(['PENDING', 'APPROVED', 'REJECTED']) approvalStatus?: string;
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 10;
}
