import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class ResetPasswordDto {
  @IsString()
  phone: string;
}
