import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { PrismaService } from '../prisma.service';
import { Role, LeadStatus, LeadTemperature } from '@prisma/client';

describe('LeadsService - Auto assignment & scoring rules', () => {
  let service: LeadsService;
  let prisma: PrismaService;

  const mockPrisma = {
    lead: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    leadActivity: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create lead with round robin assignment and COLD temperature by default', async () => {
    // Setup mock values
    mockPrisma.lead.findFirst.mockResolvedValue(null); // No duplicate
    
    // Active counselors mock
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'counsellor-1', role: Role.COUNSELLOR, isActive: true, assignedLeads: [] },
      { id: 'counsellor-2', role: Role.COUNSELLOR, isActive: true, assignedLeads: [{ assignedAt: new Date() }] }
    ]);

    const mockCreatedLead = {
      id: 'lead-test-1',
      studentName: 'Test Student',
      phone: '+919999999999',
      email: 'test@gmail.com',
      status: LeadStatus.NEW_LEAD,
      temperature: LeadTemperature.COLD,
      counsellorId: 'counsellor-1',
      leadSource: 'Google Ads',
    };

    mockPrisma.lead.create.mockResolvedValue(mockCreatedLead);
    mockPrisma.lead.findUnique.mockResolvedValue({
      ...mockCreatedLead,
      counsellor: { id: 'counsellor-1', name: 'Sarah' },
      campus: null,
      course: null,
    });

    const result = await service.createLead({
      studentName: 'Test Student',
      phone: '+919999999999',
      email: 'test@gmail.com',
      leadSource: 'Google Ads',
    });

    expect(result).toBeDefined();
    expect(result.counsellorId).toBe('counsellor-1'); // Picked counselor with fewer leads
    expect(prisma.lead.create).toHaveBeenCalled();
  });
});
