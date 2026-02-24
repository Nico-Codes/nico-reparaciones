import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CartModule } from '../cart/cart.module.js';
import { MailModule } from '../mail/mail.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [AuthModule, CartModule, MailModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
