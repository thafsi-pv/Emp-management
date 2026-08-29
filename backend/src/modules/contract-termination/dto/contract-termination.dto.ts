import { IsString, IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContractTerminationDto {
  @IsString() employeeId: string;
  @IsDateString() terminationDate: string;
  @IsString() reason: string;
  @IsOptional() @IsString() remarks?: string;
}

export class QueryContractTerminationDto {
  @IsOptional() @IsString() employeeId?: string;
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 10;
}
