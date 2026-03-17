import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RepairsController } from './repairs.controller.js';
import { RepairsService } from './repairs.service.js';
import { WhatsappModule } from '../whatsapp/whatsapp.module.js';

@Module({
  imports: [AuthModule, WhatsappModule],
  controllers: [RepairsController],
  providers: [RepairsService],
})
export class RepairsModule {}
