import {
  IsString, IsEmail, IsEnum, IsDateString,
  IsNumber, IsOptional, MinLength, IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateEmployeeDto {
  @IsOptional() @IsString() @MinLength(2) code?: string;
  @IsString() @MinLength(2) name: string;
  @IsString() address: string;
  @IsString() phone: string;
  @IsEmail() email: string;
  @IsEnum(['MALE', 'FEMALE']) gender: 'MALE' | 'FEMALE';
  @IsDateString() dateOfBirth: string;
  @IsString() departmentId: string;
  @IsString() designationId: string;
  @Type(() => Number) @IsNumber() @IsPositive() salary: number;
  @IsDateString() joiningDate: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}

export class QueryEmployeeDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() designationId?: string;
  @IsOptional() @IsEnum(['ACTIVE', 'INACTIVE', 'TERMINATED']) status?: string;
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 10;
}
