import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { StringField } from '../../../decorators';
import type { Store } from '../entities/store.entity';

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
  description!: string | null;

  @ApiProperty({
    description: 'The slug of the store',
    example: 'digital-creations-shop',
    required: false,
  })
  @IsString()
  @MinLength(1)
  @StringField({ required: false })
  slug!: string;
}
