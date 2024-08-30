import { ApiProperty } from '@nestjs/swagger';
import type { Product } from '@prisma/client';
import { $Enums, PaymentType, ProductStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { NumberField, StringField } from '../../../decorators';

export class UpdateProductDto
  implements
    Omit<
      Product,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'isActive'
      | 'storeId'
      | 'averageRating'
      | 'viewCount'
      | 'categoryId'
    >
{
  @ApiProperty({
    description: 'The title of the product',
    example: 'Pro Photoshop Actions',
  })
  @StringField()
  title!: string;

  @ApiProperty({
    description: 'A detailed description of the product',
    example: 'A set of 50 professional Photoshop actions for photographers',
  })
  @StringField()
  description!: string;

  @ApiProperty({
    enum: PaymentType,
    description: 'The type of payment accepted for this product',
    example: PaymentType.SINGLE,
  })
  paymentType!: $Enums.PaymentType;

  @ApiProperty({
    description: 'The price of the product',
    example: 29.99,
    type: 'number',
  })
  @NumberField()
  price!: Decimal;

  @ApiProperty({
    enum: ProductStatus,
    description: 'The current status of the product',
    example: ProductStatus.PUBLISHED,
  })
  status!: $Enums.ProductStatus;
}
