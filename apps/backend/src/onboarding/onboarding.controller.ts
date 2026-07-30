import { Controller, Get, Post, Body, UseGuards, Request, Param, Delete } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @UseGuards(JwtAuthGuard)
  @Get('rates')
  async getRates(@Request() req: any) {
    if (req.user.role !== 'admin') return { error: 'Unauthorized' };
    return this.onboardingService.getExchangeRates();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async onboardCompany(@Request() req: any, @Body() data: any) {
    if (req.user.role !== 'admin') return { error: 'Unauthorized' };
    return this.onboardingService.onboardCompany(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('companies')
  async getCompanies(@Request() req: any) {
    if (req.user.role !== 'admin') return { error: 'Unauthorized' };
    return this.onboardingService.getCompanies();
  }

  @UseGuards(JwtAuthGuard)
  @Get('companies/:id')
  async getCompany(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') return { error: 'Unauthorized' };
    return this.onboardingService.getCompany(Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('companies/:id')
  async deleteCompany(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') return { error: 'Unauthorized' };
    return this.onboardingService.deleteCompany(Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Post('companies/:id/employees')
  async addEmployeeToCompany(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    if (req.user.role !== 'admin') return { error: 'Unauthorized' };
    return this.onboardingService.addEmployeeToCompany(Number(id), data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('companies/:id/employees/:employeeId')
  async removeEmployeeFromCompany(@Request() req: any, @Param('id') id: string, @Param('employeeId') employeeId: string) {
    if (req.user.role !== 'admin') return { error: 'Unauthorized' };
    return this.onboardingService.removeEmployeeFromCompany(Number(id), Number(employeeId));
  }
}
