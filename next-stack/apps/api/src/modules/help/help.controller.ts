import { Controller, Get, Inject } from '@nestjs/common';
import { HelpService } from './help.service.js';

@Controller('help')
export class HelpController {
  constructor(@Inject(HelpService) private readonly helpService: HelpService) {}

  @Get()
  list() {
    return this.helpService.publicList();
  }
}
