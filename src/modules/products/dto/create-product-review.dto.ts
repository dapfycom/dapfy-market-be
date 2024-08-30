import { NumberField, StringField } from '../../../decorators';
import type { ProductReview } from '../entities/product-review.entity';

export class CreateReviewDto
  implements
    Omit<
      ProductReview,
      'id' | 'createdAt' | 'updatedAt' | 'productId' | 'userId'
    >
{
  @NumberField({
    description: 'The title of the product',
    example: 4.5,
  })
  rating!: number;

  @StringField({
    required: false,
    description: 'The comment of the product',
    example: 'Great product',
  })
  comment!: string | null;
}
