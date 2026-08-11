import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async logAction(userId: string | null, action: string, ipAddress?: string, userAgent?: string, details?: any) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        details: details || {},
      },
    });
  }

  async getLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const take = limit;

    const [total, data] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true, role: true },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }
}
