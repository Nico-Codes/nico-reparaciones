import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CartModule } from './cart/cart.module.js';
import { CatalogAdminModule } from './catalog-admin/catalog-admin.module.js';
import { DeviceCatalogModule } from './device-catalog/device-catalog.module.js';
import { HealthModule } from './health/health.module.js';
import { HelpModule } from './help/help.module.js';
import { MailModule } from './mail/mail.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RepairsModule } from './repairs/repairs.module.js';
import { StoreModule } from './store/store.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    HealthModule,
    HelpModule,
    MailModule,
    AuthModule,
    AdminModule,
    CartModule,
    CatalogAdminModule,
    DeviceCatalogModule,
    OrdersModule,
    PricingModule,
    RepairsModule,
    StoreModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
