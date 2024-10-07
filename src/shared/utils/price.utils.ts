import { Decimal } from '@prisma/client/runtime/library';

export const formatPrice = (price: Decimal | number): string => {
  if (price instanceof Decimal) {
    return price.toFixed(2);
  }

  return Number(price).toFixed(2);
};
