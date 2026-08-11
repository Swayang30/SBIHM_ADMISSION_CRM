import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CampusService {
  constructor(private prisma: PrismaService) {}

  async createCampus(dto: any) {
    const existing = await this.prisma.campus.findFirst({
      where: { OR: [{ name: dto.name }, { code: dto.code }] },
    });
    if (existing) {
      throw new ConflictException('Campus name or code already exists');
    }
    return this.prisma.campus.create({ data: dto });
  }

  async getCampuses() {
    return this.prisma.campus.findMany({
      include: {
        faculties: {
          include: {
            departments: {
              include: {
                courses: true,
              },
            },
          },
        },
      },
    });
  }

  async getCampusById(id: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { id },
      include: {
        faculties: {
          include: {
            departments: {
              include: {
                courses: true,
              },
            },
          },
        },
      },
    });
    if (!campus) throw new NotFoundException('Campus not found');
    return campus;
  }

  // Faculty
  async createFaculty(dto: any) {
    return this.prisma.faculty.create({
      data: {
        name: dto.name,
        campusId: dto.campusId,
      },
    });
  }

  // Department
  async createDepartment(dto: any) {
    return this.prisma.department.create({
      data: {
        name: dto.name,
        facultyId: dto.facultyId,
      },
    });
  }

  // Course
  async createCourse(dto: any) {
    return this.prisma.course.create({
      data: {
        name: dto.name,
        code: dto.code,
        departmentId: dto.departmentId,
        durationYrs: parseInt(dto.durationYrs),
        feeAmount: parseFloat(dto.feeAmount),
      },
    });
  }
}
