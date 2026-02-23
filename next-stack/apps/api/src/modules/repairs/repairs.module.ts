import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RepairsController } from './repairs.controller.js';
import { RepairsService } from './repairs.service.js';

@Module({
  imports: [AuthModule],
  controllers: [RepairsController],
  providers: [RepairsService],
})
export class RepairsModule {}
