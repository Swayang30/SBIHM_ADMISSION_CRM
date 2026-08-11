// Frontend Hybrid API layer (Live API + Mock Mockup fallback)

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  campusId?: string;
  token?: string;
}

// Fallback Mockup Data
const MOCK_LEADS = [
  {
    id: "lead-1",
    studentName: "Alice Smith",
    fatherName: "Robert Smith",
    phone: "+919876543210",
    email: "alice@gmail.com",
    courseId: "btech-cs",
    courseName: "B.Tech Computer Science",
    campusId: "main",
    campusName: "Main City Campus",
    status: "NEW_LEAD",
    temperature: "COLD",
    leadSource: "Google Ads",
    assignedAt: new Date().toISOString(),
    counsellorName: "Sarah Connor",
    utmCampaign: "engineering_2026",
    activities: [
      { id: "act-1", actionType: "CREATE_LEAD", description: "Lead created from Google Ads web extension.", createdAt: new Date(Date.now() - 3600000).toISOString() }
    ],
    followups: [],
    documents: [],
    whatsappMessages: []
  },
  {
    id: "lead-2",
    studentName: "Bob Jones",
    fatherName: "David Jones",
    phone: "+919876543211",
    email: "bob@yahoo.com",
    courseId: "btech-cs",
    courseName: "B.Tech Computer Science",
    campusId: "main",
    campusName: "Main City Campus",
    status: "INTERESTED",
    temperature: "WARM",
    leadSource: "Meta Ads",
    assignedAt: new Date().toISOString(),
    counsellorName: "Sarah Connor",
    utmCampaign: "btech_retargeting",
    activities: [
      { id: "act-2", actionType: "CREATE_LEAD", description: "Lead created from Meta instant forms.", createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: "act-3", actionType: "COMMUNICATION", description: "WhatsApp Outbound template message sent.", createdAt: new Date(Date.now() - 5000000).toISOString() }
    ],
    followups: [
      { id: "f-1", scheduledFor: new Date(Date.now() + 86400000).toISOString(), remarks: "Call back to discuss scholarship opportunities", isCompleted: false }
    ],
    documents: [],
    whatsappMessages: [
      { id: "w-1", direction: "OUTBOUND", messageBody: "Hello Bob! Thanks for inquiring. Here is our course brochure.", status: "READ", createdAt: new Date(Date.now() - 5000000).toISOString() }
    ]
  },
  {
    id: "lead-3",
    studentName: "Charlie Brown",
    fatherName: "George Brown",
    phone: "+919876543212",
    email: "charlie@outlook.com",
    courseId: "mba-fa",
    courseName: "MBA Financial Analytics",
    campusId: "main",
    campusName: "Main City Campus",
    status: "ADMISSION_CONFIRMED",
    temperature: "HOT",
    leadSource: "Organic Website",
    assignedAt: new Date().toISOString(),
    counsellorName: "John Doe",
    utmCampaign: "brand_search",
    activities: [
      { id: "act-4", actionType: "CREATE_LEAD", description: "Lead captured from landing page contact form.", createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "act-5", actionType: "UPDATE_LEAD", description: "Application Fee of 25,000 paid via Razorpay", createdAt: new Date(Date.now() - 4000000).toISOString() }
    ],
    followups: [],
    documents: [
      { id: "doc-1", docType: "Marksheet", fileName: "charlie_marksheet.pdf", fileSize: 1048576, uploadedBy: "John Doe", createdAt: new Date(Date.now() - 4200000).toISOString() }
    ],
    whatsappMessages: [],
    payments: [
      { id: "p-1", amount: 25000.00, purpose: "APPLICATION_FEE", gateway: "RAZORPAY", referenceId: "pay_12893172", status: "SUCCESS", createdAt: new Date(Date.now() - 4000000).toISOString() }
    ]
  }
];

export async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('crm_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!res.ok) throw new Error('API returned error state');
    return await res.json();
  } catch (err) {
    // If backend isn't running, return mock data matching standard request paths
    console.warn(`API unavailable, fallback mock triggered for: ${endpoint}`);
    return getMockDataForEndpoint(endpoint, options);
  }
}

function getMockDataForEndpoint(endpoint: string, options: RequestInit) {
  if (endpoint.startsWith('/auth/login')) {
    const body = JSON.parse(options.body as string);
    const mockRoleMap: Record<string, string> = {
      'admin@college.edu': 'SUPER_ADMIN',
      'marketing@college.edu': 'MARKETING_TEAM',
      'sarah@college.edu': 'COUNSELLOR',
      'john@college.edu': 'COUNSELLOR'
    };
    const role = mockRoleMap[body.email] || 'SUPER_ADMIN';
    const name = body.email.split('@')[0].toUpperCase();
    return {
      accessToken: "mock-jwt-token",
      user: { id: "mock-user-1", name, email: body.email, role }
    };
  }

  if (endpoint.startsWith('/reports/admin-dashboard')) {
    return {
      overview: {
        totalLeads: MOCK_LEADS.length,
        admissionsDone: MOCK_LEADS.filter(l => l.status === 'ADMISSION_CONFIRMED').length,
        conversionRate: parseFloat(((MOCK_LEADS.filter(l => l.status === 'ADMISSION_CONFIRMED').length / MOCK_LEADS.length) * 100).toFixed(2)),
        revenue: 25000,
        admissionTarget: 250,
        pendingAdmissions: 1,
        rejectedLeads: 0
      },
      statusPipeline: {
        NEW_LEAD: MOCK_LEADS.filter(l => l.status === 'NEW_LEAD').length,
        INTERESTED: MOCK_LEADS.filter(l => l.status === 'INTERESTED').length,
        ADMISSION_CONFIRMED: MOCK_LEADS.filter(l => l.status === 'ADMISSION_CONFIRMED').length,
        // others
      },
      temperatureFunnel: {
        COLD: MOCK_LEADS.filter(l => l.temperature === 'COLD').length,
        WARM: MOCK_LEADS.filter(l => l.temperature === 'WARM').length,
        HOT: MOCK_LEADS.filter(l => l.temperature === 'HOT').length
      },
      campuses: [
        { name: "Main City Campus", leads: 3, admissions: 1 }
      ],
      counsellors: [
        { name: "Sarah Connor", assigned: 2, converted: 0 },
        { name: "John Doe", assigned: 1, converted: 1 }
      ]
    };
  }

  if (endpoint.startsWith('/reports/marketing-dashboard')) {
    return {
      sources: [
        { source: 'Google Ads', leadCount: 1, cost: 35.00, admissions: 0, revenue: 0, cpl: 35.00, cac: 0, roi: -100 },
        { source: 'Meta Ads', leadCount: 1, cost: 28.00, admissions: 0, revenue: 0, cpl: 28.00, cac: 0, roi: -100 },
        { source: 'Organic Website', leadCount: 1, cost: 0.00, admissions: 1, revenue: 25000.00, cpl: 0.00, cac: 0, roi: 100 },
      ],
      comparison: {
        google: { leadCount: 1, cost: 35.00, admissions: 0, revenue: 0 },
        meta: { leadCount: 1, cost: 28.00, admissions: 0, revenue: 0 }
      }
    };
  }

  if (endpoint.startsWith('/reports/counsellor-dashboard')) {
    return {
      name: "Sarah Connor",
      metrics: {
        assignedLeads: 2,
        admissions: 0,
        hotLeads: 0,
        pendingFollowups: 1,
        callsMade: 2,
        conversionRate: 0,
        monthlyTarget: 30
      },
      leaderboard: [
        { name: "John Doe", admissions: 1 },
        { name: "Sarah Connor", admissions: 0 }
      ]
    };
  }

  if (endpoint.startsWith('/leads')) {
    // If getting single lead detail e.g. /leads/lead-1
    const match = MOCK_LEADS.find(l => endpoint.endsWith(l.id));
    if (match) return match;

    // Default query lists
    return {
      total: MOCK_LEADS.length,
      page: 1,
      limit: 20,
      totalPages: 1,
      data: MOCK_LEADS
    };
  }

  return {};
}
export { MOCK_LEADS };
