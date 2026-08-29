import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSectionDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() departmentId: string;
}

export class UpdateSectionDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() departmentId?: string;
}
