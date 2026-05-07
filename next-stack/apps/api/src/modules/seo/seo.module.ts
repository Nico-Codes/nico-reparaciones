import { Module } from '@nestjs/common';
import { StoreModule } from '../store/store.module.js';
import { SeoController } from './seo.controller.js';
import { SeoService } from './seo.service.js';

@Module({
  imports: [StoreModule],
  controllers: [SeoController],
  providers: [SeoService],
})
export class SeoModule {}
