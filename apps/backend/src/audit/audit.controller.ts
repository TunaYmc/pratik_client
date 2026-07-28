import { Controller, Get, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditController {
    constructor(private auditService: AuditService) {}

    @Get()
    async getLogs(@Request() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            throw new ForbiddenException();
        }
        return this.auditService.getLogs(
            req.user.userId, 
            req.user.role, 
            page ? parseInt(page) : 1, 
            limit ? parseInt(limit) : 20
        );
    }
}
