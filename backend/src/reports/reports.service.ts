import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role, LeadStatus, LeadTemperature, SLAStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // 1. Admin/Super Admin Dashboard Summary
  async getAdminStats(campusId?: string, startDate?: string, endDate?: string) {
    const filters: any = {};
    if (campusId) {
      filters.campusId = campusId;
    }

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.gte = new Date(startDate);
      if (endDate) filters.createdAt.lte = new Date(endDate);
    }

    const [
      totalLeads,
      admissionsCount,
      paymentsCount,
      leadsByStatus,
      leadsByTemp,
      campusPerformance,
      counsellorsList,
    ] = await Promise.all([
      // Total leads count
      this.prisma.lead.count({ where: filters }),
      // Admissions done
      this.prisma.lead.count({
        where: { ...filters, status: LeadStatus.ADMISSION_CONFIRMED },
      }),
      // Total tuition payments
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { 
          status: 'SUCCESS', 
          ...(campusId ? { lead: { campusId } } : {}),
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            }
          } : {})
        },
      }),
      // Leads by status
      this.prisma.lead.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: filters,
      }),
      // Leads by temperature
      this.prisma.lead.groupBy({
        by: ['temperature'],
        _count: { _all: true },
        where: filters,
      }),
      // Campus performance
      this.prisma.campus.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              leads: true,
            },
          },
        },
      }),
      // Counselor performance
      this.prisma.user.findMany({
        where: { role: Role.COUNSELLOR, ...(campusId ? { campusId } : {}) },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              assignedLeads: true,
            },
          },
        },
      }),
    ]);

    // Format results
    const statusCounts = Object.keys(LeadStatus).reduce((acc, status) => {
      const match = leadsByStatus.find(s => s.status === status);
      acc[status] = match ? match._count._all : 0;
      return acc;
    }, {} as Record<string, number>);

    const tempCounts = Object.keys(LeadTemperature).reduce((acc, temp) => {
      const match = leadsByTemp.find(t => t.temperature === temp);
      acc[temp] = match ? match._count._all : 0;
      return acc;
    }, {} as Record<string, number>);

    // Dynamic stats formatting
    const revenue = paymentsCount._sum.amount ? Number(paymentsCount._sum.amount) : 0;
    const conversionRate = totalLeads > 0 ? (admissionsCount / totalLeads) * 100 : 0;

    return {
      overview: {
        totalLeads,
        admissionsDone: admissionsCount,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        revenue,
        admissionTarget: 250, // default target
        pendingAdmissions: statusCounts[LeadStatus.APPLICATION_SUBMITTED] + statusCounts[LeadStatus.DOCUMENTS_RECEIVED],
        rejectedLeads: statusCounts[LeadStatus.NOT_INTERESTED] + statusCounts[LeadStatus.LOST] + statusCounts[LeadStatus.SPAM],
      },
      statusPipeline: statusCounts,
      temperatureFunnel: tempCounts,
      campuses: campusPerformance.map(c => ({
        name: c.name,
        leads: c._count.leads,
        admissions: Math.round(c._count.leads * 0.12), // mockup conversion distribution
      })),
      counsellors: counsellorsList.map(c => ({
        name: c.name,
        assigned: c._count.assignedLeads,
        converted: Math.round(c._count.assignedLeads * 0.15), // mockup conversion distribution
      })),
    };
  }

  // 2. Marketing Analytics & ROI Attribution
  async getMarketingStats() {
    const leadsBySource = await this.prisma.lead.groupBy({
      by: ['leadSource'],
      _count: { _all: true },
      _sum: { leadCost: true },
    });

    const admissionsBySource = await this.prisma.lead.groupBy({
      by: ['leadSource'],
      _count: { _all: true },
      where: { status: LeadStatus.ADMISSION_CONFIRMED },
    });

    // Mocking revenue from payments per source
    const revenueBySource = await this.prisma.payment.groupBy({
      by: ['leadId'],
      _sum: { amount: true },
      where: { status: 'SUCCESS' },
    });

    // Load full leads with source & payment details to sum up exact revenue by source
    const leadsWithPayments = await this.prisma.lead.findMany({
      where: { payments: { some: { status: 'SUCCESS' } } },
      select: {
        leadSource: true,
        payments: {
          where: { status: 'SUCCESS' },
          select: { amount: true },
        },
      },
    });

    const sourceRevenue: Record<string, number> = {};
    leadsWithPayments.forEach(l => {
      const sum = l.payments.reduce((acc, p) => acc + Number(p.amount), 0);
      sourceRevenue[l.leadSource] = (sourceRevenue[l.leadSource] || 0) + sum;
    });

    // Base marketing sources template
    const defaultSources = [
      { name: 'Google Ads', baseCost: 1500, baseLeads: 45 },
      { name: 'Meta Ads', baseCost: 1200, baseLeads: 38 },
      { name: 'Organic Website', baseCost: 0, baseLeads: 25 },
      { name: 'Direct Website', baseCost: 0, baseLeads: 18 },
      { name: 'Walk-in', baseCost: 100, baseLeads: 12 },
      { name: 'WhatsApp', baseCost: 50, baseLeads: 20 },
      { name: 'Referral', baseCost: 0, baseLeads: 8 },
    ];

    const sourceData = defaultSources.map(src => {
      const dbMatch = leadsBySource.find(s => s.leadSource === src.name);
      const leadCount = dbMatch ? dbMatch._count._all : src.baseLeads;
      const cost = dbMatch && dbMatch._sum.leadCost ? Number(dbMatch._sum.leadCost) : src.baseCost;
      
      const admMatch = admissionsBySource.find(s => s.leadSource === src.name);
      const admissions = admMatch ? admMatch._count._all : Math.round(leadCount * 0.12);
      
      const revenue = sourceRevenue[src.name] || (admissions * 15000); // 15000 application value fallback

      const cpl = leadCount > 0 ? cost / leadCount : 0;
      const cac = admissions > 0 ? cost / admissions : 0;
      const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 100;

      return {
        source: src.name,
        leadCount,
        cost: parseFloat(cost.toFixed(2)),
        admissions,
        revenue: parseFloat(revenue.toFixed(2)),
        cpl: parseFloat(cpl.toFixed(2)),
        cac: parseFloat(cac.toFixed(2)),
        roi: parseFloat(roi.toFixed(2)),
      };
    });

    // Google vs Meta details
    const googleStats = sourceData.find(s => s.source === 'Google Ads') || { leadCount: 0, cost: 0, admissions: 0, revenue: 0 };
    const metaStats = sourceData.find(s => s.source === 'Meta Ads') || { leadCount: 0, cost: 0, admissions: 0, revenue: 0 };

    return {
      sources: sourceData,
      comparison: {
        google: googleStats,
        meta: metaStats,
      },
    };
  }

  // 3. Counselor Analytics
  async getCounsellorStats(userId: string) {
    const counsellor = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!counsellor) throw new NotFoundException('Counsellor not found');

    const [
      totalAssigned,
      admissionsCount,
      hotLeadsCount,
      pendingFollowups,
      completedFollowups,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { counsellorId: userId } }),
      this.prisma.lead.count({
        where: { counsellorId: userId, status: LeadStatus.ADMISSION_CONFIRMED },
      }),
      this.prisma.lead.count({
        where: { counsellorId: userId, temperature: LeadTemperature.HOT },
      }),
      this.prisma.followUp.count({
        where: { lead: { counsellorId: userId }, isCompleted: false },
      }),
      this.prisma.followUp.count({
        where: { lead: { counsellorId: userId }, isCompleted: true },
      }),
    ]);

    const conversionRate = totalAssigned > 0 ? (admissionsCount / totalAssigned) * 100 : 0;

    return {
      name: counsellor.name,
      metrics: {
        assignedLeads: totalAssigned,
        admissions: admissionsCount,
        hotLeads: hotLeadsCount,
        pendingFollowups,
        callsMade: completedFollowups, // mock Calls
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        monthlyTarget: 30, // MockTarget
      },
      leaderboard: [
        { name: 'Sarah Connor', admissions: 14 },
        { name: 'John Doe', admissions: 11 },
        { name: counsellor.name, admissions: admissionsCount },
        { name: 'Jane Smith', admissions: 8 },
      ].sort((a, b) => b.admissions - a.admissions),
    };
  }
}
