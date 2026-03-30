import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RepairsController } from './repairs.controller.js';
import { RepairsAdminService } from './repairs-admin.service.js';
import { RepairsNotificationsService } from './repairs-notifications.service.js';
import { RepairsPricingService } from './repairs-pricing.service.js';
import { RepairsPublicService } from './repairs-public.service.js';
import { RepairsService } from './repairs.service.js';
import { RepairsSupportService } from './repairs-support.service.js';
import { RepairsTimelineService } from './repairs-timeline.service.js';
import { WhatsappModule } from '../whatsapp/whatsapp.module.js';

@Module({
  imports: [AuthModule, WhatsappModule],
  controllers: [RepairsController],
  providers: [
    RepairsSupportService,
    RepairsTimelineService,
    RepairsPricingService,
    RepairsNotificationsService,
    RepairsPublicService,
    RepairsAdminService,
    RepairsService,
  ],
})
export class RepairsModule {}
