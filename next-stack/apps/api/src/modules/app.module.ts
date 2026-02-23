import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CartModule } from './cart/cart.module.js';
import { HealthModule } from './health/health.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RepairsModule } from './repairs/repairs.module.js';
import { StoreModule } from './store/store.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    AdminModule,
    CartModule,
    OrdersModule,
    PricingModule,
    RepairsModule,
    StoreModule,
  ],
})
export class AppModule {}
