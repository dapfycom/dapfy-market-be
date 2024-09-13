import { ApiProperty } from '@nestjs/swagger';
import { SocialPlatform } from '@prisma/client';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { StringField } from '../../../decorators';
import type { Store } from '../entities/store.entity';

export class CreateStoreSocialDto {
  @ApiProperty({
    description: 'The name of the social',
    example: 'facebook',
  })
  @IsString()
  @MinLength(1)
  platform!: SocialPlatform;

  @ApiProperty({
    description: 'The url of the social',
    example: 'https://facebook.com/myawesome',
  })
  @IsString()
  @MinLength(1)
  url!: string;
}

export class CreateStoreDto
  implements
    Omit<
      Store,
      'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'products' | 'logo'
    >
{
  @ApiProperty({
    description: 'The name of the store',
    example: 'Digital Creations Shop',
  })
  @IsString()
  @MinLength(1)
  @StringField()
  name!: string;

  @ApiProperty({
    description: 'A detailed description of the store',
    example: 'We sell high-quality digital products for creatives',
    required: false,
  })
  @IsString()
  @MinLength(1)
  @StringField({ required: false })
  @IsOptional()
  description!: string | null;

  @ApiProperty({
    description: 'The slug of the store',
    example: 'digital-creations-shop',
    required: false,
  })
  @IsString()
  @MinLength(1)
  @StringField()
  @IsOptional()
  slug!: string;

  @ApiProperty({
    description: 'The banner of the store',
    example: 'oceanBreeze',
    required: true,
  })
  @IsString()
  @MinLength(1)
  @StringField({ required: true })
  banner!: string;

  @ApiProperty({
    description: 'The socials of the store',
    example: '[{"platform":"facebook","url":"https://facebook.com/myawesome"}]',
    required: true,
  })
  @IsString()
  socials!: string;
}
