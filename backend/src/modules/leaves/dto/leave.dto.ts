import { IsString, IsNotEmpty, IsEnum, IsDateString, IsOptional } from 'class-validator';

export class CreateLeaveDto {
  @IsString() @IsNotEmpty() employeeId: string;
  @IsEnum(['CASUAL', 'SICK', 'FESTIVAL', 'UNPAID', 'OTHER']) leaveType: 'CASUAL' | 'SICK' | 'FESTIVAL' | 'UNPAID' | 'OTHER';
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsString() @IsNotEmpty() reason: string;
}

export class RejectLeaveDto {
  @IsString() @IsNotEmpty() reason: string;
}
