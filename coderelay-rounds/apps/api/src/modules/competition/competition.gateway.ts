import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class CompetitionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CompetitionGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Realtime client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Realtime client disconnected: ${client.id}`);
  }

  @SubscribeMessage('client:join-room')
  handleJoinRoom(client: Socket, payload: { room: string }) {
    if (payload?.room) {
      client.join(payload.room);
      this.logger.log(`Client ${client.id} joined room ${payload.room}`);
      return { status: 'joined', room: payload.room };
    }
    return { status: 'error', message: 'Room name required' };
  }

  @SubscribeMessage('client:heartbeat')
  handleHeartbeat(client: Socket) {
    return { event: 'server:heartbeat-ack', timestamp: new Date().toISOString() };
  }

  // Broadcaster helper methods for authoritative server events
  broadcastRound1Event(event: string, payload: any) {
    if (this.server) {
      // Broadcast to round:1 room as well as global server namespace
      this.server.to('round:1').emit(event, payload);
      this.server.emit(event, payload);
      this.logger.log(`Broadcasted WebSocket event ${event} to round:1`);
    }
  }

  broadcastRound2Event(event: string, payload: any) {
    if (this.server) {
      // Broadcast to round:2 room, specific team room, role:host, and global namespace
      this.server.to('round:2').emit(event, payload);
      this.server.to('role:host').emit(event, payload);
      if (payload.teamId) {
        this.server.to(`team:${payload.teamId}`).emit(event, payload);
        if (payload.memberOrder) {
          this.server.to(`team:${payload.teamId}:member:${payload.memberOrder}`).emit(event, payload);
        }
      }
      this.server.emit(event, payload);
      this.logger.log(`Broadcasted WebSocket event ${event} to round:2`);
    }
  }

  broadcastRoundStateUpdate(payload: any) {
    if (this.server) {
      const event = payload.event || 'ROUND_STATE_UPDATED';
      this.server.emit(event, payload);
      this.server.to('round:1').emit(event, payload);
      this.server.to('round:2').emit(event, payload);
      this.logger.log(`Broadcasted lifecycle WebSocket event ${event}`);
    }
  }
}
