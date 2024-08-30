import { ApiProperty } from '@nestjs/swagger';
import type { Category as CategoryPrisma } from '@prisma/client';
import { Product } from '../../products/entities/product.entity';

export class Category implements CategoryPrisma {
  @ApiProperty({
    description: 'The unique identifier of the category',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'The name of the category',
    example: 'Design',
  })
  name!: string;
}

export class CategoryWithProducts extends Category {
  @ApiProperty({
    description: 'The products associated with this category',
    type: [Product],
    required: false,
  })
  products!: Product[];
}
