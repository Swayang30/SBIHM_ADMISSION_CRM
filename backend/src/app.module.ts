import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { CampusModule } from './campus/campus.module';
import { LeadsModule } from './leads/leads.module';
import { CommunicationsModule } from './communications/communications.module';
import { ReportsModule } from './reports/reports.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CampusModule,
    LeadsModule,
    CommunicationsModule,
    ReportsModule,
    AuditLogsModule,
  ],
})
export class AppModule {}
