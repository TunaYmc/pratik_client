import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Request } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuditService } from '../audit/audit.service';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly auditService: AuditService
    ) { }

    @Post('login')
    async login(@Body() { email, password }: LoginDto) {
        const user = await this.authService.validateUser(email, password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        await this.auditService.log('LOGIN', user.id, null, { email });
        return this.authService.login(user);
    }

    // Initial admin setup or public registration, normally admin only
    @Post('register')
    async register(@Body() { email, password, role }: RegisterDto) {
        return this.authService.registerUser(email, password, role);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req: any) {
        return req.user;
    }
}
