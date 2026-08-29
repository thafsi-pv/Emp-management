import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateFinalSettlementDto {
  @IsString() @IsNotEmpty() employeeId: string;
  @IsDateString() lastWorkingDate: string;
  @IsOptional() @IsNumber() pendingSalary?: number;
  @IsOptional() @IsNumber() leaveAdjustments?: number;
  @IsOptional() @IsNumber() otPay?: number;
  @IsOptional() @IsNumber() advanceDeductions?: number;
  @IsOptional() @IsNumber() otherAdjustments?: number;
}

export class UpdateClearanceDto {
  @IsOptional() @IsBoolean() departmentClearance?: boolean;
  @IsOptional() @IsBoolean() financeClearance?: boolean;
  @IsOptional() @IsBoolean() hrClearance?: boolean;
}
