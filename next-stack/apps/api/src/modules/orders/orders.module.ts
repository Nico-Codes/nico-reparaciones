import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CartModule } from '../cart/cart.module.js';
import { MailModule } from '../mail/mail.module.js';
import { WhatsappModule } from '../whatsapp/whatsapp.module.js';
import { OrdersAdminService } from './orders-admin.service.js';
import { OrdersCheckoutService } from './orders-checkout.service.js';
import { OrdersController } from './orders.controller.js';
import { OrdersNotificationsService } from './orders-notifications.service.js';
import { OrdersQuickSalesService } from './orders-quick-sales.service.js';
import { OrdersService } from './orders.service.js';
import { OrdersSupportService } from './orders-support.service.js';

@Module({
  imports: [AuthModule, CartModule, MailModule, WhatsappModule],
  controllers: [OrdersController],
  providers: [
    OrdersSupportService,
    OrdersNotificationsService,
    OrdersCheckoutService,
    OrdersAdminService,
    OrdersQuickSalesService,
    OrdersService,
  ],
})
export class OrdersModule {}
