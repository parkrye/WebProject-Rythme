import type { Room, RoomSummary } from './room.js';
import type { Player } from './player.js';
import type { Note, RoundResult, FinalResult, GamePhase } from './game.js';
import type { RoomMode } from '../constants/roomMode.js';
import type { InstrumentType } from '../constants/instrument.js';

// Client -> Server Events
export interface ClientToServerEvents {
  'room:create': (payload: CreateRoomPayload) => void;
  'room:join': (payload: JoinRoomPayload) => void;
  'room:leave': (payload: LeaveRoomPayload) => void;
  'room:ready': (payload: ReadyPayload) => void;
  'room:addAI': (payload: AddAIPayload) => void;
  'game:start': (payload: GameStartPayload) => void;
  'game:submitRecording': (payload: SubmitRecordingPayload) => void;
  'game:submitChallenge': (payload: SubmitChallengePayload) => void;
  'ensemble:playNote': (payload: EnsemblePlayNotePayload) => void;
}

// Server -> Client Events
export interface ServerToClientEvents {
  'room:list': (rooms: RoomSummary[]) => void;
  'room:created': (room: Room) => void;
  'room:updated': (room: Room) => void;
  'room:playerJoined': (player: Player) => void;
  'room:playerLeft': (payload: { odId: string }) => void;
  'game:phaseChanged': (payload: PhaseChangedPayload) => void;
  'game:questionReady': (payload: QuestionReadyPayload) => void;
  'game:playQuestion': (payload: QuestionReadyPayload) => void;
  'game:roundResult': (result: RoundResult) => void;
  'game:finalResult': (result: FinalResult) => void;
  'ensemble:notePlay': (payload: EnsembleNotePlayPayload) => void;
  'error': (payload: ErrorPayload) => void;
}

// Payload Types
export interface CreateRoomPayload {
  name: string;
  maxPlayers: number;
  mode: RoomMode;
}

export interface JoinRoomPayload {
  roomId: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface ReadyPayload {
  roomId: string;
  isReady: boolean;
}

export interface AddAIPayload {
  roomId: string;
  difficulty: 'easy' | 'normal' | 'hard';
}

export interface GameStartPayload {
  roomId: string;
}

export interface SubmitRecordingPayload {
  roomId: string;
  notes: Note[];
}

export interface SubmitChallengePayload {
  roomId: string;
  notes: Note[];
}

export interface PhaseChangedPayload {
  phase: GamePhase;
  questionerId?: string;
  endTime?: number;
}

export interface QuestionReadyPayload {
  notes: Note[];
}

export interface ErrorPayload {
  code: string;
  message: string;
}

// Ensemble Mode Payloads
export interface EnsemblePlayNotePayload {
  roomId: string;
  note: string;
  instrument: InstrumentType;
}

export interface EnsembleNotePlayPayload {
  odId: string;
  nickname: string;
  note: string;
  instrument: InstrumentType;
}
