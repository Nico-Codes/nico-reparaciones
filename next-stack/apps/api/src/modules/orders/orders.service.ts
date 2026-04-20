import { Inject, Injectable } from '@nestjs/common';
import { OrdersAdminService } from './orders-admin.service.js';
import { OrdersCheckoutService } from './orders-checkout.service.js';
import { OrdersQuickSalesService } from './orders-quick-sales.service.js';
import { OrdersSupportService } from './orders-support.service.js';
import type { AdminListInput, CheckoutInput, QuickSaleConfirmInput, QuickSalesHistoryInput } from './orders.types.js';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(OrdersCheckoutService) private readonly ordersCheckoutService: OrdersCheckoutService,
    @Inject(OrdersAdminService) private readonly ordersAdminService: OrdersAdminService,
    @Inject(OrdersQuickSalesService) private readonly ordersQuickSalesService: OrdersQuickSalesService,
    @Inject(OrdersSupportService) private readonly ordersSupportService: OrdersSupportService,
  ) {}

  async checkout(input: CheckoutInput) {
    return this.ordersCheckoutService.checkout(input);
  }

  async checkoutConfig() {
    return this.ordersSupportService.getCheckoutConfig();
  }

  async myOrders(userId: string) {
    return this.ordersCheckoutService.myOrders(userId);
  }

  async myOrderDetail(userId: string, orderId: string) {
    return this.ordersCheckoutService.myOrderDetail(userId, orderId);
  }

  async uploadTransferProof(
    userId: string,
    orderId: string,
    file?: { originalname: string; mimetype: string; size: number; buffer?: Buffer },
  ) {
    return this.ordersCheckoutService.uploadTransferProof(userId, orderId, file);
  }

  async adminOrders(params?: AdminListInput) {
    return this.ordersAdminService.adminOrders(params);
  }

  async adminOrderDetail(orderId: string) {
    return this.ordersAdminService.adminOrderDetail(orderId);
  }

  async adminUpdateStatus(orderId: string, statusRaw: string) {
    return this.ordersAdminService.adminUpdateStatus(orderId, statusRaw);
  }

  async adminConfirmQuickSale(input: QuickSaleConfirmInput) {
    return this.ordersQuickSalesService.adminConfirmQuickSale(input);
  }

  async adminQuickSales(params?: QuickSalesHistoryInput) {
    return this.ordersQuickSalesService.adminQuickSales(params);
  }
}
