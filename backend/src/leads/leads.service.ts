import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role, LeadStatus, LeadTemperature, SLAStatus } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  // 1. Create Lead with Round Robin Assignment
  async createLead(dto: any) {
    // Detect duplicates by phone or email
    const duplicate = await this.prisma.lead.findFirst({
      where: {
        OR: [
          { phone: dto.phone },
          { email: dto.email },
        ],
      },
    });

    let targetStatus: LeadStatus = LeadStatus.NEW_LEAD;
    if (duplicate) {
      targetStatus = LeadStatus.DUPLICATE;
    }

    // Auto-assign counselor via Round Robin
    let counsellorId = dto.counsellorId || null;
    if (!counsellorId && targetStatus !== LeadStatus.DUPLICATE) {
      counsellorId = await this.getNextRoundRobinCounsellor(dto.campusId);
    }

    // Set SLA deadline (15 minutes from now)
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + 15 * 60 * 1000);

    const lead = await this.prisma.lead.create({
      data: {
        studentName: dto.studentName,
        fatherName: dto.fatherName,
        motherName: dto.motherName,
        phone: dto.phone,
        altPhone: dto.altPhone,
        whatsappNumber: dto.whatsappNumber || dto.phone,
        email: dto.email,
        gender: dto.gender,
        dob: dto.dob ? new Date(dto.dob) : null,
        state: dto.state,
        district: dto.district,
        city: dto.city,
        pincode: dto.pincode,
        qualification: dto.qualification,
        percentage: dto.percentage ? parseFloat(dto.percentage) : null,
        
        campusId: dto.campusId || null,
        departmentId: dto.departmentId || null,
        courseId: dto.courseId || null,
        
        status: targetStatus,
        temperature: LeadTemperature.COLD,
        
        counsellorId,
        assignedAt: counsellorId ? new Date() : null,
        
        // Attribution
        leadSource: dto.leadSource || 'Organic Website',
        campaignId: dto.campaignId,
        campaignName: dto.campaignName,
        adGroup: dto.adGroup,
        keyword: dto.keyword,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        utmContent: dto.utmContent,
        utmTerm: dto.utmTerm,
        landingPageUrl: dto.landingPageUrl,
        leadCost: dto.leadCost ? parseFloat(dto.leadCost) : 0.00,
        gclid: dto.gclid,
        fbclid: dto.fbclid,

        slaDeadline,
        slaStatus: SLAStatus.WITHIN_SLA,
      },
    });

    // Record activity
    await this.prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        actionType: 'CREATE_LEAD',
        description: `Lead created from ${lead.leadSource}` + (duplicate ? ' (Flagged as duplicate)' : ''),
      },
    });

    if (counsellorId) {
      await this.prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          actionType: 'ASSIGNMENT',
          description: `Automatically assigned to counselor via Round Robin`,
        },
      });
    }

    // Auto-calculate temperature
    await this.evaluateLeadTemperature(lead.id);

    return this.prisma.lead.findUnique({
      where: { id: lead.id },
      include: {
        counsellor: { select: { id: true, name: true, email: true } },
        campus: true,
        course: true,
      },
    });
  }

  // Round robin picker helper
  private async getNextRoundRobinCounsellor(campusId?: string): Promise<string | null> {
    // Find active counselors
    const filters: any = {
      role: Role.COUNSELLOR,
      isActive: true,
    };
    if (campusId) {
      filters.campusId = campusId;
    }

    const counselors = await this.prisma.user.findMany({
      where: filters,
      include: {
        assignedLeads: {
          orderBy: { assignedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (counselors.length === 0) {
      // Fallback: search across all campuses if filtered campus has no counselors
      if (campusId) {
        return this.getNextRoundRobinCounsellor();
      }
      return null;
    }

    // Sort counselors by the assignment time of their last assigned lead (oldest assignment first, nulls are first)
    counselors.sort((a, b) => {
      const timeA = a.assignedLeads[0]?.assignedAt?.getTime() || 0;
      const timeB = b.assignedLeads[0]?.assignedAt?.getTime() || 0;
      return timeA - timeB;
    });

    return counselors[0].id;
  }

  // 2. Fetch Leads (with filters, pagination, global search)
  async getLeads(query: any, user: any) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      temperature,
      campusId,
      courseId,
      counsellorId,
      source,
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};

    // RBAC restrictions
    if (user.role === Role.COUNSELLOR) {
      where.counsellorId = user.id;
    } else if (user.role === Role.ADMISSION_MANAGER) {
      // managers view their campus leads or assigned
      if (user.campusId) {
        where.campusId = user.campusId;
      }
    } else if (user.role === Role.COLLEGE_ADMIN) {
      if (user.campusId) {
        where.campusId = user.campusId;
      }
    }

    // Apply filters
    if (status) where.status = status;
    if (temperature) where.temperature = temperature;
    if (campusId) where.campusId = campusId;
    if (courseId) where.courseId = courseId;
    if (counsellorId) where.counsellorId = counsellorId;
    if (source) where.leadSource = source;

    // Search filter
    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          counsellor: { select: { id: true, name: true } },
          campus: { select: { name: true, code: true } },
          course: { select: { name: true, code: true } },
        },
      }),
    ]);

    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / take),
      data,
    };
  }

  // 3. Get Single Lead with all relations
  async getLeadById(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        counsellor: { select: { id: true, name: true, email: true, phone: true } },
        campus: true,
        department: true,
        course: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, role: true } } },
        },
        followups: { orderBy: { scheduledFor: 'desc' } },
        documents: true,
        whatsappMessages: { orderBy: { createdAt: 'desc' } },
        payments: true,
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  // 4. Update Lead & Evaluate SLA + Temperature
  async updateLead(id: string, dto: any, userId?: string) {
    const current = await this.prisma.lead.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Lead not found');

    const updateData: any = { ...dto };
    if (dto.dob) updateData.dob = new Date(dto.dob);
    if (dto.percentage) updateData.percentage = parseFloat(dto.percentage);
    if (dto.leadCost) updateData.leadCost = parseFloat(dto.leadCost);

    // Track SLA Response
    if (!current.lastRespondedAt) {
      updateData.lastRespondedAt = new Date();
      updateData.slaStatus = SLAStatus.WITHIN_SLA;
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: updateData,
    });

    // Record activity logs for modified fields
    const changes: string[] = [];
    if (dto.status && dto.status !== current.status) {
      changes.push(`Status changed from ${current.status} to ${dto.status}`);
    }
    if (dto.counsellorId && dto.counsellorId !== current.counsellorId) {
      changes.push(`Counselor reassigned`);
    }

    if (changes.length > 0) {
      await this.prisma.leadActivity.create({
        data: {
          leadId: id,
          userId,
          actionType: 'UPDATE_LEAD',
          description: changes.join(', '),
        },
      });
    }

    // Trigger Lead Temperature Rule Re-evaluation
    await this.evaluateLeadTemperature(id);

    return this.getLeadById(id);
  }

  // 5. Dynamic Temperature Evaluation Rules Engine
  async evaluateLeadTemperature(leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        payments: true,
        documents: true,
        followups: true,
        activities: true,
      },
    });

    if (!lead || lead.isTempOverride) return;

    const payments = lead.payments || [];
    const documents = lead.documents || [];
    const followups = lead.followups || [];
    const activities = lead.activities || [];

    let temperature: LeadTemperature = LeadTemperature.COLD;

    // Condition for HOT
    const hasSuccessfulPayment = payments.some(p => p.status === 'SUCCESS');
    const isConfOrRecv = ([LeadStatus.ADMISSION_CONFIRMED, LeadStatus.PAYMENT_COMPLETED, LeadStatus.JOINED, LeadStatus.DOCUMENTS_RECEIVED] as LeadStatus[]).includes(lead.status);
    const hasDocs = documents.length >= 2;

    if (hasSuccessfulPayment || isConfOrRecv || hasDocs) {
      temperature = LeadTemperature.HOT;
    } 
    // Condition for WARM
    else {
      const isInterested = ([LeadStatus.INTERESTED, LeadStatus.COUNSELLING_SCHEDULED, LeadStatus.DOCUMENTS_PENDING, LeadStatus.APPLICATION_SUBMITTED] as LeadStatus[]).includes(lead.status);
      const hasFollowup = followups.some(f => !f.isCompleted);
      const hasActivity = activities.length >= 3;

      if (isInterested || hasFollowup || hasActivity) {
        temperature = LeadTemperature.WARM;
      }
    }

    if (lead.temperature !== temperature) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { temperature },
      });

      await this.prisma.leadActivity.create({
        data: {
          leadId,
          actionType: 'SYSTEM_RULES',
          description: `Lead temperature automatically updated to ${temperature}`,
        },
      });
    }
  }

  // 6. Follow-Up actions
  async addFollowup(leadId: string, dto: any) {
    const followup = await this.prisma.followUp.create({
      data: {
        leadId,
        scheduledFor: new Date(dto.scheduledFor),
        remarks: dto.remarks,
      },
    });

    await this.prisma.leadActivity.create({
      data: {
        leadId,
        actionType: 'REMARK_ADDED',
        description: `Scheduled follow-up for ${followup.scheduledFor.toLocaleString()}: ${dto.remarks}`,
      },
    });

    await this.evaluateLeadTemperature(leadId);
    return followup;
  }

  async completeFollowup(id: string) {
    const followup = await this.prisma.followUp.update({
      where: { id },
      data: { isCompleted: true, completedAt: new Date() },
    });

    await this.prisma.leadActivity.create({
      data: {
        leadId: followup.leadId,
        actionType: 'UPDATE_LEAD',
        description: `Follow-up completed`,
      },
    });

    return followup;
  }

  // 7. Document management
  async uploadDocument(leadId: string, doc: any) {
    const document = await this.prisma.document.create({
      data: {
        leadId,
        docType: doc.docType,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        fileSize: parseInt(doc.fileSize),
        uploadedBy: doc.uploadedBy || 'System',
      },
    });

    await this.prisma.leadActivity.create({
      data: {
        leadId,
        actionType: 'UPDATE_LEAD',
        description: `Uploaded document: ${doc.docType} (${doc.fileName})`,
      },
    });

    await this.evaluateLeadTemperature(leadId);
    return document;
  }

  // 8. Cron Check: SLA Breaches
  async checkSlaBreaches() {
    const now = new Date();
    
    // Find leads where deadline is passed, status is still WITHIN_SLA, and no response was registered
    const breachedLeads = await this.prisma.lead.findMany({
      where: {
        slaDeadline: { lt: now },
        slaStatus: SLAStatus.WITHIN_SLA,
        lastRespondedAt: null,
        status: LeadStatus.NEW_LEAD,
      },
    });

    for (const lead of breachedLeads) {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { slaStatus: SLAStatus.BREACHED },
      });

      await this.prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          actionType: 'SYSTEM_RULES',
          description: `SLA Breached! First response deadline (15m) missed by assignee.`,
        },
      });
    }

    return breachedLeads.length;
  }
}
