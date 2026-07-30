import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
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
}
