import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OrdersService } from './orders.service.js';

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(999),
    }),
  ).min(1).max(200),
  paymentMethod: z.string().trim().min(1).max(60).optional(),
});

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(@CurrentUser() user: AuthenticatedUser | null, @Body() body: unknown) {
    const parsed = checkoutSchema.safeParse(body);
    if (!user) {
      return { message: 'Usuario no autenticado' };
    }
    if (!parsed.success) {
      return {
        message: 'Validación inválida',
        errors: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      };
    }

    return this.ordersService.checkout({
      userId: user.id,
      items: parsed.data.items,
      paymentMethod: parsed.data.paymentMethod,
    });
  }

  @Get('my')
  async my(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) return { items: [] };
    return this.ordersService.myOrders(user.id);
  }

  @Get('my/:id')
  async myDetail(@CurrentUser() user: AuthenticatedUser | null, @Param('id') id: string) {
    if (!user) return { item: null };
    return this.ordersService.myOrderDetail(user.id, id);
  }
}
