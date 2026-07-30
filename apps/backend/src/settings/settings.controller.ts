import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getSettings(@Request() req: any) {
    if (req.user.role !== 'admin') return { error: 'Unauthorized' };
    return this.settingsService.getSettings();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async updateSettings(@Request() req: any, @Body() data: any) {
    if (req.user.role !== 'admin') return { error: 'Unauthorized' };
    return this.settingsService.updateSettings(data);
  }
}
