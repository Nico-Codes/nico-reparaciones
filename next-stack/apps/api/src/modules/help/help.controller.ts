import { Controller, Get } from '@nestjs/common';
import { HelpService } from './help.service.js';

@Controller('help')
export class HelpController {
  constructor(private readonly helpService: HelpService) {}

  @Get()
  list() {
    return this.helpService.publicList();
  }
}

