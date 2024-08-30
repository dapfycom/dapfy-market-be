import { ApiProperty } from '@nestjs/swagger';
import type { Review as ProductReviewPrisma } from '@prisma/client';

export class ProductReview implements ProductReviewPrisma {
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

  @ApiProperty({ description: 'Rating of the product', example: 4.5 })
  rating!: number;

  @ApiProperty({
    description: 'Comment of the product',
    example: 'Great product',
    required: false,
  })
  comment!: string | null;

  @ApiProperty({ description: 'Unique identifier for the product' })
  productId!: string;

  @ApiProperty({ description: 'Unique identifier for the user' })
  userId!: string;
}
