import { IsString, IsNotEmpty } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
