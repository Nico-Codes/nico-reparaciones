import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { zodBadRequest } from '../../common/http/zod-bad-request.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { adminQuickSaleConfirmSchema, adminUpdateStatusSchema, checkoutSchema } from './orders.schemas.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly ordersService: OrdersService) {}

  @Get('checkout-config')
  async checkoutConfig(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) throw new UnauthorizedException('Usuario no autenticado');
    return this.ordersService.checkoutConfig();
  }

  @Post('checkout')
  async checkout(@CurrentUser() user: AuthenticatedUser | null, @Body() body: unknown) {
    const parsed = checkoutSchema.safeParse(body);
    if (!user) throw new UnauthorizedException('Usuario no autenticado');
    if (!parsed.success) throw zodBadRequest(parsed);

    return this.ordersService.checkout({
      userId: user.id,
      items: parsed.data.items,
      paymentMethod: parsed.data.paymentMethod,
    });
  }

  @Get('my')
  async my(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) throw new UnauthorizedException('Usuario no autenticado');
    return this.ordersService.myOrders(user.id);
  }

  @Get('my/:id')
  async myDetail(@CurrentUser() user: AuthenticatedUser | null, @Param('id') id: string) {
    if (!user) throw new UnauthorizedException('Usuario no autenticado');
    return this.ordersService.myOrderDetail(user.id, id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminList(@Query('status') status?: string, @Query('q') q?: string) {
    return this.ordersService.adminOrders({ status, q });
  }

  @Get('admin/quick-sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminQuickSales(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('payment') payment?: string,
    @Query('adminId') adminId?: string,
  ) {
    return this.ordersService.adminQuickSales({ from, to, payment, adminId });
  }

  @Post('admin/quick-sales/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminQuickSaleConfirm(@CurrentUser() user: AuthenticatedUser | null, @Body() body: unknown) {
    if (!user) throw new UnauthorizedException('Usuario no autenticado');
    const parsed = adminQuickSaleConfirmSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.ordersService.adminConfirmQuickSale({
      adminUserId: user.id,
      ...parsed.data,
    });
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminDetail(@Param('id') id: string) {
    return this.ordersService.adminOrderDetail(id);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminUpdateStatus(@Param('id') id: string, @Body() body: unknown) {
    const parsed = adminUpdateStatusSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.ordersService.adminUpdateStatus(id, parsed.data.status);
  }
}
