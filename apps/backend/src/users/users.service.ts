import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAllUsers(page: number = 1, limit: number = 10, search: string = '') {
        const skip = (page - 1) * limit;
        const where = search ? { email: { contains: search } } : {};
        
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    managerId: true,
                    manager: { select: { email: true } },
                    createdAt: true,
                },
                orderBy: { id: 'desc' }
            }),
            this.prisma.user.count({ where })
        ]);
        
        return { data, total, page, limit };
    }

    async deleteUser(id: number) {
        return this.prisma.user.delete({
            where: { id },
        });
    }

    async updateUserRole(id: number, role: string) {
        return this.prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, email: true, role: true }
        });
    }

    async assignManager(id: number, managerId: number | null) {
        return this.prisma.user.update({
            where: { id },
            data: { managerId },
            select: { id: true, email: true, managerId: true }
        });
    }

    // --- Tag Operations ---

    async getManagerTags(managerId: number) {
        return this.prisma.tag.findMany({
            where: { managerId },
            include: {
                userTags: {
                    include: { user: { select: { id: true, email: true } } }
                }
            }
        });
    }

    async createTag(managerId: number, name: string, color?: string) {
        return this.prisma.tag.create({
            data: { managerId, name, color }
        });
    }

    async deleteTag(tagId: number, managerId: number) {
        const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
        if (!tag || tag.managerId !== managerId) {
            throw new ForbiddenException('Unauthorized or tag not found');
        }
        return this.prisma.tag.delete({ where: { id: tagId } });
    }

    async assignTagToUser(userId: number, tagId: number, managerId: number) {
        const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
        if (!tag || tag.managerId !== managerId) {
            throw new ForbiddenException('Unauthorized or tag not found');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.managerId !== managerId) {
            throw new ForbiddenException('Cannot tag users that are not your subordinates');
        }
        return this.prisma.userTag.create({
            data: { userId, tagId }
        });
    }

    async removeTagFromUser(userId: number, tagId: number) {
        return this.prisma.userTag.delete({
            where: { userId_tagId: { userId, tagId } }
        });
    }

    async getSubordinatesWithTags(managerId: number) {
        return this.prisma.user.findMany({
            where: { managerId },
            select: {
                id: true,
                email: true,
                userTags: {
                    where: { tag: { managerId } },
                    include: { tag: true }
                }
            }
        });
    }

    // --- Settings Operations ---

    async getSettings(userId: number) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        return JSON.parse((user as any)?.rdpSettings || '{}'); // cast as any to bypass temporary prisma type delay
    }

    async updateSettings(userId: number, body: any) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { rdpSettings: JSON.stringify(body) } as any // bypass type delay
        });
        return JSON.parse((user as any).rdpSettings || '{}');
    }

    // --- Password Operations ---

    async userUpdatePassword(userId: number, currentPassword: string, newPassword: string) {
        if (!currentPassword || !newPassword) {
            throw new BadRequestException('Current and new password are required');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new ForbiddenException('User not found');

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            throw new ForbiddenException('Mevcut şifre yanlış / Current password incorrect');
        }

        const password_hash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password_hash }
        });
        return { success: true };
    }

    async adminResetPassword(userId: number, newPassword: string) {
        if (!newPassword || newPassword.length < 6) {
            throw new BadRequestException('Password must be at least 6 characters');
        }
        const password_hash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password_hash }
        });
        return { success: true };
    }
}

