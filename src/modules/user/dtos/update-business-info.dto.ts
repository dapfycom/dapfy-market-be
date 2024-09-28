import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBusinessInfoDto {
  @ApiPropertyOptional({ description: 'The name of the business' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  @ApiPropertyOptional({ description: 'The company email address' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  companyEmail?: string;

  @ApiPropertyOptional({ description: 'A description of the business' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'The business website URL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;
}
