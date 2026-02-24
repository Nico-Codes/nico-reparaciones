import { Module } from '@nestjs/common';
import { HelpController } from './help.controller.js';
import { HelpService } from './help.service.js';

@Module({
  controllers: [HelpController],
  providers: [HelpService],
  exports: [HelpService],
})
export class HelpModule {}

