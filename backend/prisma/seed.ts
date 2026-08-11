import { PrismaClient, Role, LeadStatus, LeadTemperature, SLAStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records
  await prisma.auditLog.deleteMany({});
  await prisma.whatsAppMessage.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.followUp.deleteMany({});
  await prisma.leadActivity.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.campus.deleteMany({});

  // 2. Create Campuses
  const mainCampus = await prisma.campus.create({
    data: { name: 'Main City Campus', code: 'MCC', address: '101 University Ave, City Center' },
  });
  const northCampus = await prisma.campus.create({
    data: { name: 'North Valley Campus', code: 'NVC', address: '500 Valley Parkway, Northside' },
  });

  // 3. Create Academic Structure
  const engFaculty = await prisma.faculty.create({
    data: { name: 'Faculty of Engineering', campusId: mainCampus.id },
  });
  const bizFaculty = await prisma.faculty.create({
    data: { name: 'Faculty of Business Administration', campusId: mainCampus.id },
  });

  const csDept = await prisma.department.create({
    data: { name: 'Computer Science & Engineering', facultyId: engFaculty.id },
  });
  const mbaDept = await prisma.department.create({
    data: { name: 'Finance & Management', facultyId: bizFaculty.id },
  });

  const btechCs = await prisma.course.create({
    data: { name: 'B.Tech in Computer Science', code: 'BTECH-CS', departmentId: csDept.id, durationYrs: 4, feeAmount: 180000.00 },
  });
  const mtechCs = await prisma.course.create({
    data: { name: 'M.Tech in Artificial Intelligence', code: 'MTECH-AI', departmentId: csDept.id, durationYrs: 2, feeAmount: 220000.00 },
  });
  const mbaFin = await prisma.course.create({
    data: { name: 'MBA in Financial Analytics', code: 'MBA-FA', departmentId: mbaDept.id, durationYrs: 2, feeAmount: 250000.00 },
  });

  // 4. Create Users (Default password for all: Password123)
  const passwordHash = await bcrypt.hash('Password123', 10);

  const superAdmin = await prisma.user.create({
    data: { name: 'Super Admin', email: 'admin@college.edu', passwordHash, role: Role.SUPER_ADMIN, isActive: true },
  });

  const collegeAdmin = await prisma.user.create({
    data: { name: 'Main Campus Admin', email: 'main-admin@college.edu', passwordHash, role: Role.COLLEGE_ADMIN, campusId: mainCampus.id, isActive: true },
  });

  const marketing = await prisma.user.create({
    data: { name: 'Attribution Specialist', email: 'marketing@college.edu', passwordHash, role: Role.MARKETING_TEAM, isActive: true },
  });

  const counsellor1 = await prisma.user.create({
    data: { name: 'Sarah Connor', email: 'sarah@college.edu', passwordHash, role: Role.COUNSELLOR, campusId: mainCampus.id, isActive: true },
  });

  const counsellor2 = await prisma.user.create({
    data: { name: 'John Doe', email: 'john@college.edu', passwordHash, role: Role.COUNSELLOR, campusId: mainCampus.id, isActive: true },
  });

  console.log('Seeded users: admin@college.edu, marketing@college.edu, sarah@college.edu, john@college.edu');

  // 5. Create Sample Leads with varied statuses & UTM Parameters
  const leads = [
    {
      studentName: 'Alice Smith',
      fatherName: 'Robert Smith',
      phone: '+919876543210',
      email: 'alice@gmail.com',
      gender: 'Female',
      state: 'California',
      district: 'Los Angeles',
      city: 'LA',
      qualification: 'High School',
      percentage: 88.5,
      campusId: mainCampus.id,
      departmentId: csDept.id,
      courseId: btechCs.id,
      status: LeadStatus.NEW_LEAD,
      temperature: LeadTemperature.COLD,
      counsellorId: counsellor1.id,
      leadSource: 'Google Ads',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'engineering_2026',
      leadCost: 35.00,
    },
    {
      studentName: 'Bob Jones',
      fatherName: 'David Jones',
      phone: '+919876543211',
      email: 'bob@yahoo.com',
      gender: 'Male',
      state: 'Texas',
      district: 'Travis',
      city: 'Austin',
      qualification: 'High School',
      percentage: 76.2,
      campusId: mainCampus.id,
      departmentId: csDept.id,
      courseId: btechCs.id,
      status: LeadStatus.INTERESTED,
      temperature: LeadTemperature.WARM,
      counsellorId: counsellor1.id,
      leadSource: 'Meta Ads',
      utmSource: 'facebook',
      utmMedium: 'cpc',
      utmCampaign: 'btech_retargeting',
      leadCost: 28.00,
    },
    {
      studentName: 'Charlie Brown',
      fatherName: 'George Brown',
      phone: '+919876543212',
      email: 'charlie@outlook.com',
      gender: 'Male',
      state: 'New York',
      district: 'Manhattan',
      city: 'NYC',
      qualification: 'Graduate',
      percentage: 81.0,
      campusId: mainCampus.id,
      departmentId: mbaDept.id,
      courseId: mbaFin.id,
      status: LeadStatus.ADMISSION_CONFIRMED,
      temperature: LeadTemperature.HOT,
      counsellorId: counsellor2.id,
      leadSource: 'Organic Website',
      utmSource: 'seo',
      utmMedium: 'organic',
      utmCampaign: 'brand_search',
      leadCost: 0.00,
    },
  ];

  for (const l of leads) {
    const lead = await prisma.lead.create({
      data: {
        ...l,
        slaDeadline: new Date(Date.now() + 15 * 60 * 1000),
        assignedAt: new Date(),
      },
    });

    // Create a start activity log
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        actionType: 'CREATE_LEAD',
        description: `Lead imported during database seed setup. Source: ${lead.leadSource}`,
      },
    });

    if (lead.status === LeadStatus.ADMISSION_CONFIRMED) {
      // Seed a payment
      await prisma.payment.create({
        data: {
          leadId: lead.id,
          amount: 25000.00,
          purpose: 'APPLICATION_FEE',
          gateway: 'RAZORPAY',
          referenceId: 'pay_' + Math.random().toString(36).substr(2, 9),
          status: 'SUCCESS',
        },
      });

      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          actionType: 'UPDATE_LEAD',
          description: `Application Fee of 25,000 paid via Razorpay. Reference: SUCCESS`,
        },
      });
    }

    if (lead.status === LeadStatus.INTERESTED) {
      // Seed a follow-up
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
          remarks: 'Follow up about scholarship details request.',
        },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
