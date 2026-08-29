import { IsString, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDesignationDto {
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(2) code: string;
}
export class UpdateDesignationDto extends PartialType(CreateDesignationDto) {}
