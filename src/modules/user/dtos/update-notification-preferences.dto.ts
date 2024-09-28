import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({
    description: 'Preference for receiving notifications about new sales',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  newSales?: boolean;

  @ApiPropertyOptional({
    description: 'Preference for receiving notifications about product updates',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  productUpdates?: boolean;

  @ApiPropertyOptional({
    description:
      'Preference for receiving notifications about community activity',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  communityActivity?: boolean;

  @ApiPropertyOptional({
    description: 'Preference for receiving marketing emails',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;
}
