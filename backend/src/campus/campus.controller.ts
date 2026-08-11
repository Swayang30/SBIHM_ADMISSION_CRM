import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CampusService } from './campus.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('campus')
export class CampusController {
  constructor(private campusService: CampusService) {}

  @Get()
  async getCampuses() {
    return this.campusService.getCampuses();
  }

  @Get(':id')
  async getCampusById(@Param('id') id: string) {
    return this.campusService.getCampusById(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  @Post()
  async createCampus(@Body() body: any) {
    return this.campusService.createCampus(body);
  }

  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  @Post('faculty')
  async createFaculty(@Body() body: any) {
    return this.campusService.createFaculty(body);
  }

  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  @Post('department')
  async createDepartment(@Body() body: any) {
    return this.campusService.createDepartment(body);
  }

  @Roles(Role.SUPER_ADMIN, Role.COLLEGE_ADMIN)
  @Post('course')
  async createCourse(@Body() body: any) {
    return this.campusService.createCourse(body);
  }
}
