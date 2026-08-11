import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN, Role.ADMISSION_MANAGER)
  @Get('admin-dashboard')
  async getAdminStats(
    @Query('campusId') campusId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getAdminStats(campusId, startDate, endDate);
  }

  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN, Role.MARKETING_TEAM)
  @Get('marketing-dashboard')
  async getMarketingStats() {
    return this.reportsService.getMarketingStats();
  }

  @Get('counsellor-dashboard')
  async getCounsellorStats(@Request() req) {
    return this.reportsService.getCounsellorStats(req.user.id);
  }
}
