import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Post()
  async createLead(@Body() body: any) {
    return this.leadsService.createLead(body);
  }

  @Get()
  async getLeads(@Query() query: any, @Request() req) {
    return this.leadsService.getLeads(query, req.user);
  }

  @Get(':id')
  async getLeadById(@Param('id') id: string) {
    return this.leadsService.getLeadById(id);
  }

  @Patch(':id')
  async updateLead(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.leadsService.updateLead(id, body, req.user.id);
  }

  @Post(':id/followup')
  async addFollowup(@Param('id') id: string, @Body() body: any) {
    return this.leadsService.addFollowup(id, body);
  }

  @Patch('followup/:id/complete')
  async completeFollowup(@Param('id') id: string) {
    return this.leadsService.completeFollowup(id);
  }

  @Post(':id/document')
  async uploadDocument(@Param('id') id: string, @Body() body: any) {
    return this.leadsService.uploadDocument(id, body);
  }

  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  @Post('sla-check')
  async checkSla() {
    const breaches = await this.leadsService.checkSlaBreaches();
    return { status: 'success', breachedCount: breaches };
  }
}
