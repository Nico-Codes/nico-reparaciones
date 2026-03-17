import { BadRequestException, Body, Controller, ForbiddenException, Get, Inject, Post, Query, ServiceUnavailableException } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service.js';

@Controller('whatsapp/webhook')
export class WhatsappController {
  constructor(@Inject(WhatsappService) private readonly whatsappService: WhatsappService) {}

  @Get()
  verify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') verifyToken?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    const verification = this.whatsappService.verifyWebhook(mode, verifyToken, challenge);
    if (!verification.ok && verification.error === 'not_configured') {
      throw new ServiceUnavailableException('Webhook de WhatsApp Cloud API no configurado');
    }
    if (!verification.ok && verification.error === 'invalid_request') {
      throw new BadRequestException('Solicitud de verificacion invalida');
    }
    if (!verification.ok && verification.error === 'forbidden') {
      throw new ForbiddenException('Verify token invalido');
    }
    if (!verification.ok) {
      throw new BadRequestException('Solicitud de verificacion invalida');
    }
    return verification.challenge;
  }

  @Post()
  async receive(@Body() body: unknown) {
    return this.whatsappService.handleWebhook(body);
  }
}
