import type { Player } from './player.js';
import type { GameState } from './game.js';

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface Room {
  roomId: string;
  name: string;
  hostId: string;
  status: RoomStatus;
  maxPlayers: number;
  currentRound: number;
  totalRounds: number;
  createdAt: number;
  players: Record<string, Player>;
  gameState: GameState | null;
}

export interface RoomSummary {
  roomId: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: RoomStatus;
}
