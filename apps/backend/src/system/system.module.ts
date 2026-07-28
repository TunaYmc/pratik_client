import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { SystemGateway } from './system.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [SystemController],
    providers: [SystemService, SystemGateway]
})
export class SystemModule { }
