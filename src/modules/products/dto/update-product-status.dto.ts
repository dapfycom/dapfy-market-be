import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProductStatusDto {
  @ApiProperty({
    description: 'The new status of the product',
    example: ProductStatus.PUBLISHED,
  })
  @IsEnum(ProductStatus)
  status!: ProductStatus;
}
