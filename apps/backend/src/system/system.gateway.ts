import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SystemService } from './system.service';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class SystemGateway implements OnModuleInit {
    @WebSocketServer()
    server: Server;

    constructor(private readonly systemService: SystemService) {}

    onModuleInit() {
        // Broadcast server load every 5 seconds to all connected clients
        setInterval(async () => {
            try {
                const load = await this.systemService.getServerLoad();
                this.server.emit('server_load', load);
            } catch (e) {
                console.error('WebSocket Error fetching server load:', e);
            }
        }, 5000);
    }
}
