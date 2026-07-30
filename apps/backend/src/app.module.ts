import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RdpModule } from './rdp/rdp.module';
import { SystemModule } from './system/system.module';
import { AuditModule } from './audit/audit.module';
import { AgentModule } from './agent/agent.module';
import { BrokerModule } from './broker/broker.module';
import { SettingsModule } from './settings/settings.module';
import { OnboardingModule } from './onboarding/onboarding.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    PrismaModule, 
    AuthModule, 
    UsersModule, 
    RdpModule, 
    SystemModule,
    AuditModule,
    AgentModule,
    BrokerModule,
    SettingsModule,
    OnboardingModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
