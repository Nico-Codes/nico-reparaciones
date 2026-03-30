import { Module } from '@nestjs/common';
import { PublicAssetStorageService } from '../../common/storage/public-asset-storage.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CatalogAdminCategoriesService } from './catalog-admin-categories.service.js';
import { CatalogAdminController } from './catalog-admin.controller.js';
import { CatalogAdminPricingService } from './catalog-admin-pricing.service.js';
import { CatalogAdminProductsService } from './catalog-admin-products.service.js';
import { CatalogAdminService } from './catalog-admin.service.js';
import { CatalogAdminSupportService } from './catalog-admin-support.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CatalogAdminController],
  providers: [
    PublicAssetStorageService,
    CatalogAdminSupportService,
    CatalogAdminCategoriesService,
    CatalogAdminPricingService,
    CatalogAdminProductsService,
    CatalogAdminService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class CatalogAdminModule {}
