import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreatePayStructureDto {
  @IsString() @IsNotEmpty() designationId: string;
  @IsEnum(['DAILY', 'MONTHLY']) payType: 'DAILY' | 'MONTHLY';
  @IsNumber() basicPay: number;
  @IsOptional() @IsNumber() weightage?: number;
  @IsOptional() @IsNumber() allowance?: number;
  @IsOptional() @IsNumber() otRate?: number;
  @IsDateString() effectiveFrom: string;
}

export class CreatePayRevisionDto {
  @IsString() @IsNotEmpty() employeeId: string;
  @IsNumber() oldBasicPay: number;
  @IsNumber() newBasicPay: number;
  @IsDateString() effectiveDate: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() orderNumber?: string;
}
