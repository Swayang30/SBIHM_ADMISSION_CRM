import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  @Get()
  async getLogs(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.auditLogsService.getLogs(parseInt(page), parseInt(limit));
  }
}
