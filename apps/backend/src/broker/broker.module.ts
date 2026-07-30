import { Module } from '@nestjs/common';
import { BrokerGateway } from './broker.gateway';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BrokerGateway],
  exports: [BrokerGateway],
})
export class BrokerModule {}
