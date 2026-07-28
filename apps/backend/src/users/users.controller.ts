import { Controller, Get, Post, Put, Body, Delete, Param, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin/users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    async getAllUsers(
        @Request() req: any, 
        @Query('page') page?: string, 
        @Query('limit') limit?: string, 
        @Query('search') search?: string
    ) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.usersService.findAllUsers(
            page ? parseInt(page) : 1, 
            limit ? parseInt(limit) : 10, 
            search
        );
    }

    @Delete(':id')
    async deleteUser(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.usersService.deleteUser(parseInt(id, 10));
    }

    @Post(':id/role')
    async changeUserRole(@Request() req: any, @Param('id') id: string, @Body() body: { role: string }) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.usersService.updateUserRole(parseInt(id, 10), body.role);
    }

    @Post(':id/manager')
    async assignManager(@Request() req: any, @Param('id') id: string, @Body() body: { managerId: number | null }) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }
        return this.usersService.assignManager(parseInt(id, 10), body.managerId);
    }

    @Put(':id/password')
    async resetUserPassword(@Request() req: any, @Param('id') id: string, @Body() body: { newPassword: string }) {
        if (req.user.role !== 'admin') throw new ForbiddenException('Admin access required');
        return this.usersService.adminResetPassword(parseInt(id, 10), body.newPassword);
    }
}

@UseGuards(JwtAuthGuard)
@Controller('admin/tags')
export class TagsController {
    constructor(private usersService: UsersService) { }

    @Get()
    async getMyTags(@Request() req: any) {
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            throw new ForbiddenException('Manager access required');
        }
        return this.usersService.getManagerTags(req.user.userId);
    }

    @Post()
    async createTag(@Request() req: any, @Body() body: { name: string; color?: string }) {
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            throw new ForbiddenException('Manager access required');
        }
        return this.usersService.createTag(req.user.userId, body.name, body.color);
    }

    @Delete(':id')
    async deleteTag(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            throw new ForbiddenException('Manager access required');
        }
        return this.usersService.deleteTag(parseInt(id, 10), req.user.userId);
    }

    @Post(':tagId/assign/:userId')
    async assignTag(@Request() req: any, @Param('tagId') tagId: string, @Param('userId') userId: string) {
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            throw new ForbiddenException('Manager access required');
        }
        return this.usersService.assignTagToUser(parseInt(userId, 10), parseInt(tagId, 10), req.user.userId);
    }

    @Delete(':tagId/assign/:userId')
    async removeTag(@Request() req: any, @Param('tagId') tagId: string, @Param('userId') userId: string) {
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            throw new ForbiddenException('Manager access required');
        }
        return this.usersService.removeTagFromUser(parseInt(userId, 10), parseInt(tagId, 10));
    }

    @Get('subordinates')
    async getSubordinatesWithTags(@Request() req: any) {
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            throw new ForbiddenException('Manager access required');
        }
        return this.usersService.getSubordinatesWithTags(req.user.userId);
    }
}

@UseGuards(JwtAuthGuard)
@Controller('user/settings')
export class UserSettingsController {
    constructor(private usersService: UsersService) {}

    @Get()
    async getSettings(@Request() req: any) {
        return this.usersService.getSettings(req.user.userId);
    }

    @Put()
    async updateSettings(@Request() req: any, @Body() body: any) {
        return this.usersService.updateSettings(req.user.userId, body);
    }

    @Put('password')
    async updatePassword(@Request() req: any, @Body() body: any) {
        return this.usersService.userUpdatePassword(req.user.userId, body.currentPassword, body.newPassword);
    }
}

