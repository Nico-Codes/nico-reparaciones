import { describe, expect, it } from 'vitest';
import { cartQuoteSchema } from './cart.controller.js';

describe('cartQuoteSchema', () => {
  it('accepts base inventory lines with null variantId', () => {
    const parsed = cartQuoteSchema.safeParse({
      items: [{ productId: 'product-1', variantId: null, quantity: 2 }],
    });

    expect(parsed.success).toBe(true);
  });
});
