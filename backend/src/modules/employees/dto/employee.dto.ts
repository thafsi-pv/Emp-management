import {
  IsString, IsEmail, IsEnum, IsDateString,
  IsNumber, IsOptional, MinLength, IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateEmployeeDto {
  @IsOptional() @IsString() @MinLength(2) code?: string;
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() photo?: string;
  @IsString() address: string;
  @IsString() phone: string;
  @IsEmail() email: string;
  @IsEnum(['MALE', 'FEMALE']) gender: 'MALE' | 'FEMALE';
  @IsDateString() dateOfBirth: string;
  @IsOptional() @IsString() idDetails?: string;
  @IsOptional() @IsEnum(['GENERAL', 'MORNING', 'EVENING', 'NIGHT']) shift?: 'GENERAL' | 'MORNING' | 'EVENING' | 'NIGHT';
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() accountNumber?: string;
  @IsOptional() @IsString() ifscCode?: string;
  @IsOptional() @IsString() panNumber?: string;
  @IsOptional() @IsEnum(['DAYS_89', 'DAYS_178', 'ONE_YEAR', 'EXTENSION', 'THREE_MONTHS', 'SIX_MONTHS', 'CUSTOM']) appointmentType?: string;
  @IsString() departmentId: string;
  @IsOptional() @IsString() sectionId?: string;
  @IsOptional() @IsString() supervisorId?: string;
  @IsString() designationId: string;
  // Defaults to the selected designation's basic pay; retained for imports.
  @IsOptional() @Type(() => Number) @IsNumber() @IsPositive() salary?: number;
  @IsDateString() joiningDate: string;
  @IsOptional() @IsEnum(['ACTIVE', 'INACTIVE', 'LEAVE', 'OFF', 'SERVICE_BREAK', 'EXPIRED', 'RESIGNED', 'TERMINATED']) status?: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}

export class QueryEmployeeDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() sectionId?: string;
  @IsOptional() @IsString() designationId?: string;
  @IsOptional() @IsString() supervisorId?: string;
  @IsOptional() @IsEnum(['ACTIVE', 'INACTIVE', 'LEAVE', 'OFF', 'SERVICE_BREAK', 'EXPIRED', 'RESIGNED', 'TERMINATED']) status?: string;
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 100;
}
