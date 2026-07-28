import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class RdpService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }

    async assignRdp(userId: number, windows_username: string, host: string, description: string, durationDays?: number, initialPassword?: string) {


        // Upsert the Windows Account
        const account = await this.prisma.windowsAccount.create({
            data: { windows_username, host, description }
        });

        let expiresAt = null;
        if (durationDays && durationDays > 0) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationDays);
        }

        // Create assignment
        return this.prisma.userAssignment.create({
            data: {
                userId,
                windowsAccountId: account.id,
                expiresAt,
            }
        });
    }

    async getMySessions(userId: number) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        // Find personal assignments
        const assignments = await this.prisma.userAssignment.findMany({
            where: {
                userId,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
            },
            include: {
                windowsAccount: true,
            }
        });
        const personalSessions = assignments.map((a: any) => ({ ...a.windowsAccount, assignedTo: null }));

        // If manager, find assignments for subordinates
        let subordinateSessions: any[] = [];
        if (user && user.role === 'manager') {
            const subordinateAssignments = await this.prisma.userAssignment.findMany({
                where: {
                    user: { managerId: userId },
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
                },
                include: {
                    user: {
                        select: {
                            email: true,
                            userTags: {
                                include: { tag: true }
                            }
                        }
                    },
                    windowsAccount: true,
                }
            });
            subordinateSessions = subordinateAssignments.map((a: any) => ({
                ...a.windowsAccount,
                assignedTo: a.user.email,
                assignmentId: a.id,
                tags: (a.user.userTags || []).filter((ut: any) => ut.tag.managerId === userId).map((ut: any) => ({ id: ut.tag.id, name: ut.tag.name, color: ut.tag.color }))
            }));
        }

        return [...personalSessions, ...subordinateSessions];
    }

    async getAllAssignments(page: number = 1, limit: number = 10, search: string = '') {
        const skip = (page - 1) * limit;
        const where: any = { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] };
        if (search) {
            where.user = { email: { contains: search } };
        }
        const [data, total] = await Promise.all([
            this.prisma.userAssignment.findMany({
                where, skip, take: limit, include: { user: { select: { email: true } }, windowsAccount: true }, orderBy: { id: 'desc' }
            }),
            this.prisma.userAssignment.count({ where })
        ]);
        return { data, total, page, limit };
    }

    async removeAssignment(assignmentId: number) {
        return this.prisma.userAssignment.delete({
            where: { id: assignmentId }
        });
    }

    async getActiveSessions(userId: number, role: string) {
        // In the multi-server architecture, active sessions are populated
        // in the database by the Session Host Agents.
        const activeSessions = await this.prisma.activeSession.findMany({
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Map them to match the structure expected by the frontend
        const sessions = activeSessions.map(s => ({
            username: s.username,
            sessionname: s.sessionname,
            id: s.sessionId,
            state: s.state,
            idleTime: s.idleTime,
            logonTime: s.logonTime,
            isCurrent: s.isCurrent
        }));

        if (role !== 'admin') {
            const myAssignedDecks = await this.getMySessions(userId);
            const allowedUsernames = myAssignedDecks.map((a: any) => a.windows_username.toLowerCase());
            return sessions.filter((s: any) => allowedUsernames.includes(s.username.toLowerCase()));
        }

        return sessions;
    }

    async getSessionHosts() {
        return this.prisma.sessionHost.findMany({
            orderBy: {
                lastSeen: 'desc'
            }
        });
    }

    async verifyRemoteDesktopGroup(username: string): Promise<boolean> {
        try {
            const { stdout } = await execAsync(
                `powershell -Command "Get-LocalGroupMember -Group 'Remote Desktop Users' | Select-Object -ExpandProperty Name"`
            );
            const members = stdout.toLowerCase().split('\n').map(m => m.trim());
            return members.some((m) => m.includes(username.toLowerCase()));
        } catch (e) {
            console.error('Failed to verify group:', e);
            return false; // Safely fail
        }
    }

    async getManagerAssignments(managerId: number, page: number = 1, limit: number = 10, search: string = '') {
        const skip = (page - 1) * limit;
        const where: any = {
            user: { managerId, email: search ? { contains: search } : undefined },
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        };
        const [data, total] = await Promise.all([
            this.prisma.userAssignment.findMany({
                where, skip, take: limit, include: { user: { select: { email: true } }, windowsAccount: true }, orderBy: { id: 'desc' }
            }),
            this.prisma.userAssignment.count({ where })
        ]);
        return { data, total, page, limit };
    }

    async createConnectionToken(userId: number, accountId: number) {
        // Verify assignment directly to user
        const assignment = await this.prisma.userAssignment.findUnique({
            where: { userId_windowsAccountId: { userId, windowsAccountId: accountId } },
            include: { windowsAccount: true }
        });

        if (assignment && assignment.expiresAt && assignment.expiresAt < new Date()) {
            throw new ForbiddenException('Assignment has expired');
        }

        if (!assignment) {
            // Check if user is a manager and the account belongs to a subordinate
            const subordinateAssignment = await this.prisma.userAssignment.findFirst({
                where: {
                    windowsAccountId: accountId,
                    user: { managerId: userId },
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
                },
                include: { windowsAccount: true }
            });

            if (!subordinateAssignment) {
                throw new ForbiddenException('Access denied to this target');
            }
        }

        // Create a 1-minute valid token
        return this.jwtService.sign(
            { sub: userId, accountId: accountId },
            { expiresIn: '1m', secret: process.env.RDP_JWT_SECRET || 'rdp-secret' }
        );
    }

    async generateRdpContent(token: string) {
        try {
            const payload = this.jwtService.verify(token, { secret: process.env.RDP_JWT_SECRET || 'rdp-secret' });
            const account = await this.prisma.windowsAccount.findUnique({
                where: { id: payload.accountId }
            });
            if (!account) throw new ForbiddenException('Account not found');
            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
            const settings = JSON.parse((user as any)?.rdpSettings || '{}');

            // Settings are applied directly in the RDP template below

            const loadBalanceInfo = `loadbalanceinfo:s:tsv://MS Terminal Services Plugin.1.${account.host.toLowerCase()}`;

            return `redirectclipboard:i:${settings.clipboardRedirection ? 1 : 0}
redirectprinters:i:${settings.printerRedirection ? 1 : 0}
redirectcomports:i:${settings.comPortRedirection ? 1 : 0}
redirectsmartcards:i:${settings.smartCardRedirection ? 1 : 0}
redirectdrives:i:${settings.driveRedirection ? 1 : 0}
${settings.driveRedirection ? 'drivestoredirect:s:*\ndevicestoredirect:s:*' : ''}
session bpp:i:32
prompt for credentials on client:i:1
server port:i:3389
allow font smoothing:i:1
promptcredentialonce:i:1
gatewayusagemethod:i:2
gatewayprofileusagemethod:i:1
gatewaycredentialssource:i:0
full address:s:PB-WIN-MGMT.PRATIKBULUT.LOCAL
gatewayhostname:s:rds.pratikbulut.com
workspace id:s:pb-win-mgmt.pratikbulut.local
use redirection server name:i:1
${loadBalanceInfo}
use multimon:i:${settings.multiMonitor ? 1 : 0}
audiomode:i:${settings.audioMode !== undefined ? settings.audioMode : 0}
audiocapturemode:i:${settings.microphoneRedirection ? 1 : 0}
${settings.smartSizing ? 'smart sizing:i:1' : 'smart sizing:i:0'}
${settings.highResolution ? 'dynamic resolution:i:1\nforcehidpioptimizations:i:1\ndesktopwidth:i:0\ndesktopheight:i:0' : 'dynamic resolution:i:0'}
username:s:${account.windows_username}@pratikbulut.local
`;
        } catch (e) {
            throw new ForbiddenException('Invalid or expired RDP connection token');
        }
    }
}
