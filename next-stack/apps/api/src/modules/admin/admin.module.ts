import { Module } from '@nestjs/common';
import { PublicAssetStorageService } from '../../common/storage/public-asset-storage.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../mail/mail.module.js';
import { WhatsappModule } from '../whatsapp/whatsapp.module.js';
import { AdminBrandAssetsService } from './admin-brand-assets.service.js';
import { AdminCommunicationsService } from './admin-communications.service.js';
import { AdminController } from './admin.controller.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AdminFinanceService } from './admin-finance.service.js';
import { AdminProvidersService } from './admin-providers.service.js';
import { AdminSettingsService } from './admin-settings.service.js';
import { AdminService } from './admin.service.js';
import { AdminWarrantyRegistryService } from './admin-warranty-registry.service.js';

@Module({
  imports: [AuthModule, MailModule, WhatsappModule],
  controllers: [AdminController],
  providers: [
    PublicAssetStorageService,
    AdminDashboardService,
    AdminSettingsService,
    AdminBrandAssetsService,
    AdminCommunicationsService,
    AdminWarrantyRegistryService,
    AdminFinanceService,
    AdminProvidersService,
    AdminService,
  ],
})
export class AdminModule {}
