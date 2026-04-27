import { Body, Controller, Inject, Post } from '@nestjs/common';
import { z } from 'zod';
import { CartService } from './cart.service.js';

const cartQuoteSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      variantId: z.string().min(1).optional(),
      quantity: z.number().int().min(1).max(999),
    }),
  ).max(200),
});

@Controller('cart')
export class CartController {
  constructor(@Inject(CartService) private readonly cartService: CartService) {}

  @Post('quote')
  async quote(@Body() body: unknown) {
    const parsed = cartQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return {
        items: [],
        totals: { subtotal: 0, itemsCount: 0 },
        errors: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      };
    }

    return this.cartService.quote(parsed.data.items);
  }
}
