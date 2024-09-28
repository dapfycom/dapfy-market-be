import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePersonalInfoDto {
  @ApiPropertyOptional({
    description: "User's name",
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: "User's Telegram handle",
    example: '@johndoe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  telegram?: string;

  @ApiPropertyOptional({
    description: "User's WhatsApp number",
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  whatsApp?: string;

  @ApiPropertyOptional({
    description: "User's Twitter handle",
    example: '@johndoe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  twitter?: string;
}
