import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CatalogAdminController } from './catalog-admin.controller.js';
import { CatalogAdminService } from './catalog-admin.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CatalogAdminController],
  providers: [CatalogAdminService, JwtAuthGuard, RolesGuard],
})
export class CatalogAdminModule {}
