import { Global, Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller.js';
import { WhatsappService } from './whatsapp.service.js';

@Global()
@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}

