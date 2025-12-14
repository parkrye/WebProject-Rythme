import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@rhythm-game/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: TypedSocket | null = null;

  connect(odId: string): TypedSocket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io('http://localhost:4000', {
      auth: { odId },
      transports: ['websocket'],
    }) as TypedSocket;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }

  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit(event, ...args);
  }

  on<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K]
  ): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.on(event, callback as (...args: unknown[]) => void);
  }

  off<K extends keyof ServerToClientEvents>(event: K): void {
    if (!this.socket) return;
    this.socket.off(event);
  }
}

export const socketService = new SocketService();
