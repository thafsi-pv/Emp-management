import { IsEnum, IsNumber, IsString, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { PayType } from '@prisma/client';

export class CreateDesignationDto {
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(2) code: string;
  @IsEnum(PayType) payType: PayType;
  @IsNumber() basicPay: number;
  @IsNumber() weightage: number;
  @IsNumber() allowance: number;
  @IsNumber() otRate: number;
}
export class UpdateDesignationDto extends PartialType(CreateDesignationDto) {}
