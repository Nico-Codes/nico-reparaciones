import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DeviceCatalogController } from './device-catalog.controller.js';
import { DeviceCatalogService } from './device-catalog.service.js';

@Module({
  imports: [AuthModule],
  controllers: [DeviceCatalogController],
  providers: [DeviceCatalogService],
  exports: [DeviceCatalogService],
})
export class DeviceCatalogModule {}
