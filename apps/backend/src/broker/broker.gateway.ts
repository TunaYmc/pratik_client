import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { PrismaService } from '../prisma.service';

@WebSocketGateway({
  path: '/broker',
})
export class BrokerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track the active broker connection
  private brokerClient: any = null;

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: any, ...args: any[]) {
    console.log(`Broker Agent connected`);
    this.brokerClient = client;
  }

  async handleDisconnect(client: any) {
    if (this.brokerClient === client) {
      console.log(`Broker Agent disconnected`);
      this.brokerClient = null;
    }
  }

  @SubscribeMessage('onboard_result')
  async handleOnboardResult(
    @ConnectedSocket() client: any,
    @MessageBody() data: any
  ) {
    const { companyId, success, error } = data;
    const status = success ? 'active' : 'failed';
    
    // Update Company status
    await this.prisma.company.update({
      where: { id: companyId },
      data: { status }
    });

    // Update Employees status
    await this.prisma.companyEmployee.updateMany({
      where: { companyId },
      data: { status }
    });

    console.log(`Company onboarding ${companyId} resulted in: ${status}`, error || '');
  }

  public async sendOnboardTask(payload: any) {
    if (!this.brokerClient) {
      throw new Error('Broker Agent is not connected.');
    }

    const msg = {
      event: 'onboard_company',
      data: payload
    };

    // Use JSON.stringify for ws package
    this.brokerClient.send(JSON.stringify(msg));
  }
}
