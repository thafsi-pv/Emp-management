import { IsEmail, IsEnum, IsOptional, IsString, MinLength, IsUUID } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export enum SystemRole {
  ADMIN = 'ADMIN',
  ESTABLISHMENT_OFFICER = 'ESTABLISHMENT_OFFICER',
  PAYROLL_OFFICER = 'PAYROLL_OFFICER',
  SUPERVISOR = 'SUPERVISOR',
  MANAGEMENT = 'MANAGEMENT',
  DEPARTMENT_OFFICER = 'DEPARTMENT_OFFICER',
  EMPLOYEE = 'EMPLOYEE',
}

export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(SystemRole)
  role: SystemRole;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  newPassword: string;
}
