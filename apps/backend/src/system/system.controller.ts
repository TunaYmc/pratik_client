import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('system')
export class SystemController {
    constructor(private readonly systemService: SystemService) { }

    @UseGuards(JwtAuthGuard)
    @Get('ping')
    ping() {
        return { status: 'ok' };
    }

    @UseGuards(JwtAuthGuard)
    @Get('load')
    async getLoad() {
        return this.systemService.getServerLoad();
    }
}
