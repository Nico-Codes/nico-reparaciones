import { Module } from '@nestjs/common';
import { PublicAssetStorageService } from '../../common/storage/public-asset-storage.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../mail/mail.module.js';
import { WhatsappModule } from '../whatsapp/whatsapp.module.js';
import { AdminBrandAssetsService } from './admin-brand-assets.service.js';
import { AdminController } from './admin.controller.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AdminSettingsService } from './admin-settings.service.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [AuthModule, MailModule, WhatsappModule],
  controllers: [AdminController],
  providers: [
    PublicAssetStorageService,
    AdminDashboardService,
    AdminSettingsService,
    AdminBrandAssetsService,
    AdminService,
  ],
})
export class AdminModule {}
