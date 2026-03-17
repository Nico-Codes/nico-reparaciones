import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CartModule } from '../cart/cart.module.js';
import { MailModule } from '../mail/mail.module.js';
import { WhatsappModule } from '../whatsapp/whatsapp.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [AuthModule, CartModule, MailModule, WhatsappModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
