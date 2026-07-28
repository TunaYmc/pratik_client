import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RdpService } from './rdp.service';
import { RdpController } from './rdp.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [JwtModule.register({}), AuditModule],
    controllers: [RdpController],
    providers: [RdpService],
    exports: [RdpService],
})
export class RdpModule { }
