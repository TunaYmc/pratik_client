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
import * as http from 'http';

@WebSocketGateway({
  path: '/agent',
})
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map to store connected agents: socket instance -> hostname
  private connectedAgents: Map<any, string> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: any, ...args: any[]) {
    // In WsAdapter, args[0] is the http.IncomingMessage request object
    const req = args[0] as http.IncomingMessage;
    const hostname = req.headers['x-hostname'] as string;
    
    if (!hostname) {
      console.error(`Agent connection rejected: No hostname provided.`);
      client.close(1008, 'Hostname required in headers');
      return;
    }

    console.log(`Agent connected: ${hostname}`);
    this.connectedAgents.set(client, hostname);

    // Upsert the SessionHost in the database
    // We don't have ipAddress easily here unless we parse it from req.socket.remoteAddress
    const ipAddress = req.socket?.remoteAddress || '';
    
    await this.prisma.sessionHost.upsert({
      where: { hostname: hostname },
      update: {
        status: 'online',
        lastSeen: new Date(),
        ipAddress: ipAddress,
      },
      create: {
        hostname: hostname,
        status: 'online',
        ipAddress: ipAddress,
      },
    });
  }

  async handleDisconnect(client: any) {
    const hostname = this.connectedAgents.get(client);
    if (hostname) {
      console.log(`Agent disconnected: ${hostname}`);
      this.connectedAgents.delete(client);

      await this.prisma.sessionHost.update({
        where: { hostname },
        data: { status: 'offline', lastSeen: new Date() },
      });
      
      await this.prisma.activeSession.deleteMany({
        where: { host: hostname }
      });
    }
  }

  @SubscribeMessage('telemetry')
  async handleTelemetry(
    @ConnectedSocket() client: any,
    @MessageBody() data: any
  ) {
    const hostname = this.connectedAgents.get(client);
    if (!hostname) return;
    
    // WsAdapter payload is raw, depends on how the client sends it.
    // If sent as { event: 'telemetry', data: { cpuUsage, ramUsage } }
    const payload = data; 
    
    await this.prisma.sessionHost.update({
      where: { hostname },
      data: {
        cpuUsage: payload.cpuUsage,
        ramUsage: payload.ramUsage,
        lastSeen: new Date(),
      },
    });
  }

  @SubscribeMessage('active_sessions')
  async handleActiveSessions(
    @ConnectedSocket() client: any,
    @MessageBody() sessions: any[]
  ) {
    const hostname = this.connectedAgents.get(client);
    if (!hostname) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.activeSession.deleteMany({ where: { host: hostname } });
      
      if (sessions && sessions.length > 0) {
        await tx.activeSession.createMany({
          data: sessions.map((s: any) => ({
            host: hostname,
            username: s.username,
            sessionname: s.sessionname,
            sessionId: s.id,
            state: s.state,
            idleTime: s.idleTime,
            logonTime: s.logonTime,
            isCurrent: s.isCurrent,
          }))
        });
      }
    });

    await this.prisma.sessionHost.update({
      where: { hostname },
      data: { lastSeen: new Date() }
    });
  }
}
