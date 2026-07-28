import { Module } from '@nestjs/common';
import { AgentGateway } from './agent.gateway';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AgentGateway],
})
export class AgentModule {}
