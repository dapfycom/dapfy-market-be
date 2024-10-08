import { ApiProperty } from '@nestjs/swagger';
import type { Product } from '@prisma/client';
import { $Enums, PaymentType, ProductStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IsArray, IsOptional, IsString } from 'class-validator';
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

  @ApiProperty({
    description: 'The slug of the product',
    example: 'pro-photoshop-actions',
  })
  @StringField()
  slug!: string;

  @ApiProperty({
    description: 'The long description of the product',
    example: '# A detailed description of the product',
  })
  @StringField({ required: false })
  longDescription!: string | null;

  @ApiProperty({
    description: 'The ids of the images to remove from the product',
    example: ['id-image1', 'id-image2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  removeImages?: string[];
}
