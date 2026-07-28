import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) {}

    async log(actionId: string, actorId: number, targetId?: number | null, metadata?: any) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    actionId,
                    actorId,
                    targetId,
                    metadata: metadata ? JSON.stringify(metadata) : null,
                }
            });
        } catch (e) {
            console.error('Failed to write audit log', e);
        }
    }

    async getLogs(userId: number, role: string, page = 1, limit = 20) {
        let where: any = {};
        
        if (role === 'manager') {
            where = {
                OR: [
                    { actorId: userId },
                    { actor: { managerId: userId } },
                    { target: { managerId: userId } }
                ]
            };
        } else if (role !== 'admin') {
            where = {
                OR: [
                    { actorId: userId },
                    { targetId: userId }
                ]
            };
        }

        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: { actor: { select: { email: true } }, target: { select: { email: true } } },
                orderBy: { id: 'desc' }
            }),
            this.prisma.auditLog.count({ where })
        ]);

        return { data, total, page, limit };
    }
}
