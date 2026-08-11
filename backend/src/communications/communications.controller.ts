import { Controller, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('communications')
export class CommunicationsController {
  constructor(private commsService: CommunicationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':leadId/whatsapp')
  async sendWhatsApp(@Param('leadId') leadId: string, @Body() body: any) {
    return this.commsService.sendWhatsAppMessage(leadId, body);
  }

  @Post('whatsapp-webhook')
  async receiveWebhook(@Body() body: any) {
    return this.commsService.receiveWebhook(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':leadId/call')
  async triggerCall(@Param('leadId') leadId: string, @Request() req) {
    return this.commsService.triggerMockCall(leadId, req.user.id);
  }
}
