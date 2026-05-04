import { describe, expect, it } from 'vitest';
import { checkoutSchema } from './orders.schemas.js';

describe('checkoutSchema', () => {
  it('accepts base inventory checkout lines with null variantId', () => {
    const parsed = checkoutSchema.safeParse({
      items: [{ productId: 'product-1', variantId: null, quantity: 2 }],
      paymentMethod: 'efectivo',
    });

    expect(parsed.success).toBe(true);
  });
});
