import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CommunicationsService {
  constructor(private prisma: PrismaService) {}

  // 1. Send WhatsApp message (Mocking Twilio or Meta Business API)
  async sendWhatsAppMessage(leadId: string, body: any) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const whatsappNumber = lead.whatsappNumber || lead.phone;

    // Simulate WhatsApp API Gateway delivery check
    const isFailed = whatsappNumber.startsWith('+91000') || whatsappNumber === '0000000000';
    const status = isFailed ? 'FAILED' : 'SENT';
    const errorMessage = isFailed ? 'Invalid phone number format or unreachable' : null;

    const message = await this.prisma.whatsAppMessage.create({
      data: {
        leadId,
        direction: 'OUTBOUND',
        messageBody: body.messageBody,
        templateName: body.templateName || null,
        status,
        errorMessage,
        messageSid: 'whatsapp-sid-' + Math.random().toString(36).substr(2, 9),
      },
    });

    // Also add to timeline activities
    await this.prisma.leadActivity.create({
      data: {
        leadId,
        actionType: 'COMMUNICATION',
        description: `WhatsApp Outbound: ${body.messageBody.substring(0, 60)}${body.messageBody.length > 60 ? '...' : ''} (Status: ${status})`,
      },
    });

    // Mock automatic status transition to DELIVERED and READ after 1 second if sent successfully
    if (status === 'SENT') {
      setTimeout(async () => {
        try {
          await this.prisma.whatsAppMessage.update({
            where: { id: message.id },
            data: { status: 'READ' },
          });
        } catch (e) {
          // ignore if connection closed
        }
      }, 1000);
    }

    return message;
  }

  // 2. Incoming Webhook Receiver (Simulating Meta Callback)
  async receiveWebhook(body: any) {
    const fromNumber = body.from; // e.g. "+919876543210"
    const text = body.text;

    // Try to find matching lead
    let lead = await this.prisma.lead.findFirst({
      where: {
        OR: [
          { phone: fromNumber },
          { whatsappNumber: fromNumber },
        ],
      },
    });

    if (!lead) {
      // Create new lead if someone messages for the first time
      lead = await this.prisma.lead.create({
        data: {
          studentName: 'WhatsApp Contact',
          phone: fromNumber,
          whatsappNumber: fromNumber,
          email: `${fromNumber.replace(/\D/g, '')}@whatsapp.temp`,
          leadSource: 'WhatsApp',
          slaDeadline: new Date(Date.now() + 15 * 60 * 1000),
          slaStatus: 'WITHIN_SLA',
        },
      });
    }

    const message = await this.prisma.whatsAppMessage.create({
      data: {
        leadId: lead.id,
        direction: 'INBOUND',
        messageBody: text,
        status: 'READ',
        messageSid: body.messageSid || 'inbound-sid-' + Math.random().toString(36).substr(2, 9),
      },
    });

    await this.prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        actionType: 'COMMUNICATION',
        description: `WhatsApp Inbound: ${text}`,
      },
    });

    return { status: 'logged', messageId: message.id, leadId: lead.id };
  }

  // 3. Click-to-call mock
  async triggerMockCall(leadId: string, counsellorId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    await this.prisma.leadActivity.create({
      data: {
        leadId,
        userId: counsellorId,
        actionType: 'COMMUNICATION',
        description: `Click-to-call initiated. Dialing ${lead.phone}... Call connected, duration: 2m 14s. Disposition: Interested.`,
      },
    });

    return { status: 'connected', duration: '134s', recordingUrl: 'https://cdn.crm-recordings.com/rec-1298379.mp3' };
  }
}
