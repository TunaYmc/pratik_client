import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { PrismaModule } from '../prisma.module';
import { BrokerModule } from '../broker/broker.module';

@Module({
  imports: [PrismaModule, BrokerModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
