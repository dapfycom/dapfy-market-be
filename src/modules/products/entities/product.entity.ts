import { ApiProperty } from '@nestjs/swagger';
import type { Product as ProductPrisma } from '@prisma/client';
import { PaymentType, ProductStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class Product implements ProductPrisma {
  @ApiProperty({
    description: 'Unique identifier for the product',
    example: '11b936b5-5e31-4dc7-8637-c03ecc770065',
  })
  id!: string;

  @ApiProperty({ description: 'Date and time when the product was created' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Date and time when the product was last updated',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Title of the product',
    example: 'Pro Photoshop Actions',
  })
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the product',
    example: 'A set of 50 professional Photoshop actions for photographers',
  })
  description!: string;

  @ApiProperty({
    description: 'Price of the product',
    type: 'number',
    example: 29.99,
  })
  price!: Decimal;

  @ApiProperty({
    description: 'Unique identifier of the store',
    example: '11b936b5-5e31-4dc7-8637-c03ecc770065',
  })
  storeId!: string;

  @ApiProperty({
    description: 'Indicates if the product is currently active',
  })
  isActive!: boolean;

  @ApiProperty({
    description: 'Status of the product',
    enum: ProductStatus,
    example: ProductStatus.PUBLISHED,
  })
  status!: ProductStatus;

  @ApiProperty({
    description: 'Payment type for the product',
    enum: PaymentType,
    example: PaymentType.SINGLE,
  })
  paymentType!: PaymentType;

  @ApiProperty({
    description: 'Unique identifier of the category',
    example: '11b936b5-5e31-4dc7-8637-c03ecc770065',
  })
  categoryId!: string;

  @ApiProperty({
    description: 'Average rating of the product',
    example: 4.5,
  })
  averageRating!: number;

  @ApiProperty({
    description: 'View count of the product',
    example: 100,
  })
  viewCount!: number;
}
