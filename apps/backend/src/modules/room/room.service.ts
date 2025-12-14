import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../services/firebase.service';
import type { Room, RoomSummary, Player } from '@rhythm-game/shared';

@Injectable()
export class RoomService {
  constructor(private readonly firebase: FirebaseService) {}

  async createRoom(
    hostId: string,
    hostNickname: string,
    name: string,
    maxPlayers: number,
  ): Promise<Room> {
    const roomId = this.generateRoomId();

    const hostPlayer: Player = {
      odId: hostId,
      nickname: hostNickname,
      score: 0,
      isAI: false,
      isReady: true,
      joinedAt: Date.now(),
    };

    const room: Room = {
      roomId,
      name,
      hostId,
      status: 'waiting',
      maxPlayers,
      currentRound: 0,
      totalRounds: 0, // 게임 시작 시 플레이어 수에 따라 계산됨
      createdAt: Date.now(),
      players: { [hostId]: hostPlayer },
      gameState: null,
    };

    await this.firebase.set(`rooms/${roomId}`, room);
    return room;
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return this.firebase.get<Room>(`rooms/${roomId}`);
  }

  async getRoomList(): Promise<RoomSummary[]> {
    const rooms = await this.firebase.get<Record<string, Room>>('rooms');
    if (!rooms) return [];

    return Object.values(rooms)
      .filter((room) => room && room.players)
      .map((room) => ({
        roomId: room.roomId,
        name: room.name,
        playerCount: Object.keys(room.players).length,
        maxPlayers: room.maxPlayers,
        status: room.status,
      }));
  }

  async joinRoom(
    roomId: string,
    odId: string,
    nickname: string,
  ): Promise<Player | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;
    if (room.status !== 'waiting') return null;
    if (Object.keys(room.players).length >= room.maxPlayers) return null;

    const player: Player = {
      odId,
      nickname,
      score: 0,
      isAI: false,
      isReady: false,
      joinedAt: Date.now(),
    };

    await this.firebase.set(`rooms/${roomId}/players/${odId}`, player);
    return player;
  }

  async leaveRoom(roomId: string, odId: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room) return false;

    await this.firebase.remove(`rooms/${roomId}/players/${odId}`);

    const remainingPlayers = Object.values(room.players).filter(
      (p) => p.odId !== odId,
    );

    const humanPlayers = remainingPlayers.filter((p) => !p.isAI);

    // 사람 플레이어가 없으면 방 삭제
    if (humanPlayers.length === 0) {
      await this.firebase.remove(`rooms/${roomId}`);
      return true;
    }

    // 방장이 나갔으면 다른 사람 플레이어에게 이전
    if (room.hostId === odId) {
      const newHostId = humanPlayers[0].odId;
      await this.firebase.update(`rooms/${roomId}`, { hostId: newHostId });
    }

    return true;
  }

  async setReady(
    roomId: string,
    odId: string,
    isReady: boolean,
  ): Promise<void> {
    await this.firebase.update(`rooms/${roomId}/players/${odId}`, { isReady });
  }

  async addAIPlayer(roomId: string, aiPlayer: Player): Promise<void> {
    await this.firebase.set(`rooms/${roomId}/players/${aiPlayer.odId}`, aiPlayer);
  }

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<void> {
    await this.firebase.update(`rooms/${roomId}`, updates);
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.firebase.remove(`rooms/${roomId}`);
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
