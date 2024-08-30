import { ApiProperty } from '@nestjs/swagger';
import { StringField } from '../../../decorators';
import type { Store } from '../entities/store.entity';

export class CreateStoreDto
  implements
    Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'products'>
{
  @ApiProperty({
    description: 'The name of the store',
    example: 'Digital Creations Shop',
  })
  @StringField()
  name!: string;

  @ApiProperty({
    description: 'A detailed description of the store',
    example: 'We sell high-quality digital products for creatives',
    required: false,
  })
  @StringField({ required: false })
  description!: string | null;
}
