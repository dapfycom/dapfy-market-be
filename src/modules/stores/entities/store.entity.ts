import { ApiProperty } from '@nestjs/swagger';
import type { Store as StorePrisma } from '@prisma/client';

export class Store implements StorePrisma {
  @ApiProperty({
    description: 'Unique identifier for the store',
    example: '11b936b5-5e31-4dc7-8637-c03ecc770065',
  })
  id!: string;

  @ApiProperty({ description: 'Date and time when the store was created' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Date and time when the store was last updated',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Name of the store',
    example: 'My Awesome Store',
  })
  name!: string;

  @ApiProperty({
    description: 'Detailed description of the store',
    example: 'A store selling digital products and services',
  })
  description!: string | null;

  @ApiProperty({
    description: 'Unique identifier of the store owner',
    example: '11b936b5-5e31-4dc7-8637-c03ecc770065',
  })
  ownerId!: string;

  @ApiProperty({
    description: 'The slug of the store',
    example: 'my-awesome-store',
  })
  slug!: string;

  @ApiProperty({
    description: 'The logo of the store',
    example: 'https://example.com/logo.png',
  })
  logo!: string;

  @ApiProperty({
    description: 'The banner of the store',
    example: 'oceanBreeze',
  })
  banner!: string;
}
