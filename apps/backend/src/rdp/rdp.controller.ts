import { Controller, Post, Get, Body, Query, Res, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { RdpService } from './rdp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';
import { AuditService } from '../audit/audit.service';

@Controller()
export class RdpController {
    constructor(private rdpService: RdpService, private auditService: AuditService) { }

    @UseGuards(JwtAuthGuard)
    @Get('my-sessions')
    async getMySessions(@Request() req: any) {
        return this.rdpService.getMySessions(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('admin/assign-rdp')
    async assignRdp(@Request() req: any, @Body() body: any) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }
        const { userId, windows_username, host, description, durationDays, initialPassword } = body;
        const assignment = await this.rdpService.assignRdp(userId, windows_username, host, description, durationDays, initialPassword);
        await this.auditService.log('ASSIGNMENT_CREATED', req.user.userId, userId, { host, windows_username });
        return assignment;
    }

    @UseGuards(JwtAuthGuard)
    @Get('admin/assignments')
    async getAllAssignments(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string
    ) {
        const p = page ? parseInt(page) : 1;
        const l = limit ? parseInt(limit) : 10;
        if (req.user.role === 'admin') {
            return this.rdpService.getAllAssignments(p, l, search);
        } else if (req.user.role === 'manager') {
            return this.rdpService.getManagerAssignments(req.user.userId, p, l, search);
        } else {
            throw new ForbiddenException('Admin or Manager access required');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('admin/assignments/:id/revoke') // Or DELETE
    async revokeAssignment(@Request() req: any, @Request() request: any) {
        const id = parseInt(request.params.id);
        
        if (req.user.role === 'manager') {
            // Verify the revoked assignment belongs to a subordinate
            const res = await this.rdpService.getManagerAssignments(req.user.userId, 1, 9999);
            const controlsIt = res.data.some((a: any) => a.id === id);
            if (!controlsIt) throw new ForbiddenException('Cannot revoke assignment not belonging to a subordinate');
        } else if (req.user.role !== 'admin') {
            throw new ForbiddenException('Admin or Manager access required');
        }
        
        await this.rdpService.removeAssignment(id);
        await this.auditService.log('ASSIGNMENT_REVOKED', req.user.userId, null, { assignmentId: id });
        return { success: true };
    }

    @UseGuards(JwtAuthGuard)
    @Get('admin/active-sessions')
    async getActiveSessions(@Request() req: any) {
        if (req.user.role !== 'admin' && req.user.role !== 'manager') throw new ForbiddenException('Admin or Manager access required');
        return this.rdpService.getActiveSessions(req.user.userId, req.user.role);
    }

    @UseGuards(JwtAuthGuard)
    @Get('admin/rdp-group')
    async testRdpGroup(@Request() req: any, @Body() body: { username: string }) {
        if (req.user.role !== 'admin') throw new ForbiddenException();
        return { isMember: await this.rdpService.verifyRemoteDesktopGroup(body.username) };
    }

    @UseGuards(JwtAuthGuard)
    @Post('rdp/generate')
    async generateRdpToken(@Request() req: any, @Body() body: { accountId: number }) {
        const token = await this.rdpService.createConnectionToken(req.user.userId, body.accountId);
        await this.auditService.log('RDP_CONNECT', req.user.userId, null, { accountId: body.accountId });
        return { token }; // Return short-lived token to be passed to helper
    }

    // Public endpoint used by Helper to download the actual RDP file securely using the token
    @Get('rdp/download')
    async downloadRdpFile(@Query('token') token: string, @Res() res: any) {
        const content = await this.rdpService.generateRdpContent(token);
        res.setHeader('Content-Type', 'application/x-rdp');
        res.setHeader('Content-Disposition', 'attachment; filename="connection.rdp"');
        res.send(content);
    }
}
