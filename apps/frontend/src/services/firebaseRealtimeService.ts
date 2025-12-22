import {
  ref,
  onValue,
  onChildAdded,
  set,
  update,
  remove,
  push,
  get,
  DatabaseReference,
  DataSnapshot,
  Unsubscribe,
  query,
  orderByChild,
  limitToLast,
} from 'firebase/database';
import { getFirebaseDatabase } from '../config/firebase';
import type {
  Room,
  RoomSummary,
  RoomMode,
  Player,
  GameState,
  Note,
  Challenge,
  RoundResult,
  FinalResult,
  InstrumentType,
  SimilarityDetails,
} from '@rhythm-game/shared';
import { calculateTotalTurns, ROOM_MODES } from '@rhythm-game/shared';

type SubscriptionCallback<T> = (data: T | null) => void;

class FirebaseRealtimeService {
  private subscriptions: Map<string, Unsubscribe> = new Map();

  private getRef(path: string): DatabaseReference {
    return ref(getFirebaseDatabase(), path);
  }

  // 방 목록 실시간 구독
  subscribeToRooms(callback: SubscriptionCallback<Record<string, Room>>): () => void {
    const roomsRef = this.getRef('rooms');

    const unsubscribe = onValue(roomsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data);
    });

    const key = 'rooms';
    this.subscriptions.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(key);
    };
  }

  // 특정 방 실시간 구독
  subscribeToRoom(roomId: string, callback: SubscriptionCallback<Room>): () => void {
    const roomRef = this.getRef(`rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data);
    });

    const key = `room:${roomId}`;
    this.subscriptions.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(key);
    };
  }

  // 게임 상태 실시간 구독
  subscribeToGameState(roomId: string, callback: SubscriptionCallback<Room['gameState']>): () => void {
    const gameStateRef = this.getRef(`rooms/${roomId}/gameState`);

    const unsubscribe = onValue(gameStateRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data);
    });

    const key = `gameState:${roomId}`;
    this.subscriptions.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(key);
    };
  }

  // 플레이어 목록 실시간 구독
  subscribeToPlayers(
    roomId: string,
    callback: SubscriptionCallback<Room['players']>
  ): () => void {
    const playersRef = this.getRef(`rooms/${roomId}/players`);

    const unsubscribe = onValue(playersRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data);
    });

    const key = `players:${roomId}`;
    this.subscriptions.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(key);
    };
  }

  // 출제 멜로디 실시간 구독
  subscribeToQuestion(
    roomId: string,
    callback: SubscriptionCallback<{ questionerId: string; notes: { note: string; timestamp: number }[] }>
  ): () => void {
    const questionRef = this.getRef(`rooms/${roomId}/currentQuestion`);

    const unsubscribe = onValue(questionRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data);
    });

    const key = `question:${roomId}`;
    this.subscriptions.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(key);
    };
  }

  // 도전 결과 실시간 구독
  subscribeToChallenges(
    roomId: string,
    callback: SubscriptionCallback<Record<string, Challenge>>
  ): () => void {
    const challengesRef = this.getRef(`rooms/${roomId}/challenges`);

    const unsubscribe = onValue(challengesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data);
    });

    const key = `challenges:${roomId}`;
    this.subscriptions.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(key);
    };
  }

  // 라운드 결과 실시간 구독
  subscribeToRoundResult(
    roomId: string,
    callback: SubscriptionCallback<{ round: number; winnerId: string | null; similarity: number }>
  ): () => void {
    const resultRef = this.getRef(`rooms/${roomId}/roundResult`);

    const unsubscribe = onValue(resultRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data);
    });

    const key = `roundResult:${roomId}`;
    this.subscriptions.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(key);
    };
  }

  // 최종 결과 실시간 구독
  subscribeToFinalResult(
    roomId: string,
    callback: SubscriptionCallback<{ rankings: Array<{ odId: string; nickname: string; score: number; rank: number }> }>
  ): () => void {
    const resultRef = this.getRef(`rooms/${roomId}/finalResult`);

    const unsubscribe = onValue(resultRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      callback(data);
    });

    const key = `finalResult:${roomId}`;
    this.subscriptions.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(key);
    };
  }

  // 모든 구독 해제
  unsubscribeAll(): void {
    this.subscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.subscriptions.clear();
  }

  // 특정 구독 해제
  unsubscribe(key: string): void {
    const unsubscribe = this.subscriptions.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  // 방 목록을 RoomSummary로 변환
  convertToRoomSummaries(rooms: Record<string, Room> | null): RoomSummary[] {
    if (!rooms) return [];

    return Object.values(rooms).map((room) => ({
      roomId: room.roomId,
      name: room.name,
      mode: room.mode,
      playerCount: Object.keys(room.players || {}).length,
      maxPlayers: room.maxPlayers,
      status: room.status,
    }));
  }

  // ==================== 쓰기 함수들 ====================

  // 방 생성
  async createRoom(
    odId: string,
    nickname: string,
    name: string,
    maxPlayers: number,
    mode: RoomMode
  ): Promise<Room> {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const player: Player = {
      odId,
      nickname,
      score: 0,
      isAI: false,
      isReady: true,
      joinedAt: Date.now(),
    };

    const room: Room = {
      roomId,
      name,
      hostId: odId,
      mode,
      status: 'waiting',
      maxPlayers,
      currentRound: 0,
      totalRounds: 0,
      createdAt: Date.now(),
      players: { [odId]: player },
      gameState: null,
    };

    await set(this.getRef(`rooms/${roomId}`), room);
    return room;
  }

  // 방 입장
  async joinRoom(roomId: string, odId: string, nickname: string): Promise<Player | null> {
    const roomRef = this.getRef(`rooms/${roomId}`);
    const snapshot = await get(roomRef);
    const room = snapshot.val() as Room | null;

    if (!room) return null;
    if (room.status !== 'waiting') return null;
    if (Object.keys(room.players || {}).length >= room.maxPlayers) return null;

    const player: Player = {
      odId,
      nickname,
      score: 0,
      isAI: false,
      isReady: false,
      joinedAt: Date.now(),
    };

    await set(this.getRef(`rooms/${roomId}/players/${odId}`), player);
    return player;
  }

  // 방 퇴장
  async leaveRoom(roomId: string, odId: string): Promise<void> {
    const roomRef = this.getRef(`rooms/${roomId}`);
    const snapshot = await get(roomRef);
    const room = snapshot.val() as Room | null;

    if (!room) return;

    // 플레이어 제거
    await remove(this.getRef(`rooms/${roomId}/players/${odId}`));

    // 남은 플레이어 확인
    const playersSnapshot = await get(this.getRef(`rooms/${roomId}/players`));
    const players = playersSnapshot.val();

    // 실제 플레이어만 카운팅 (AI 제외)
    const realPlayers = players
      ? Object.values(players as Record<string, Player>).filter((p) => !p.isAI)
      : [];

    if (!players || Object.keys(players).length === 0 || realPlayers.length === 0) {
      // 아무도 없거나 AI만 남으면 방 삭제
      await remove(roomRef);
    } else if (room.hostId === odId) {
      // 호스트가 나가면 실제 플레이어 중에서 호스트 위임
      const newHost = realPlayers[0];
      if (newHost) {
        await update(roomRef, { hostId: newHost.odId });
      }
    }
  }

  // AI 플레이어 제거
  async removeAI(roomId: string, aiId: string): Promise<void> {
    await remove(this.getRef(`rooms/${roomId}/players/${aiId}`));
  }

  // 준비 상태 토글
  async setReady(roomId: string, odId: string, isReady: boolean): Promise<void> {
    await update(this.getRef(`rooms/${roomId}/players/${odId}`), { isReady });
  }

  // AI 플레이어 추가
  async addAI(roomId: string, difficulty: 'easy' | 'normal' | 'hard' = 'easy'): Promise<Player | null> {
    const roomRef = this.getRef(`rooms/${roomId}`);
    const snapshot = await get(roomRef);
    const room = snapshot.val() as Room | null;

    if (!room) return null;
    if (Object.keys(room.players || {}).length >= room.maxPlayers) return null;

    const aiId = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const aiPlayer: Player = {
      odId: aiId,
      nickname: `AI_${difficulty}`,
      score: 0,
      isAI: true,
      isReady: true,
      joinedAt: Date.now(),
    };

    await set(this.getRef(`rooms/${roomId}/players/${aiId}`), aiPlayer);
    return aiPlayer;
  }

  // 게임 시작
  async startGame(roomId: string): Promise<GameState | null> {
    const roomRef = this.getRef(`rooms/${roomId}`);
    const snapshot = await get(roomRef);
    const room = snapshot.val() as Room | null;

    if (!room) return null;

    // 합주 모드: 게임 로직 없이 바로 연주 시작
    if (room.mode === ROOM_MODES.ENSEMBLE) {
      await update(roomRef, { status: 'playing' });
      return null;
    }

    // 게임 모드: 게임 상태 초기화
    const playerIds = Object.keys(room.players || {});
    const totalTurns = calculateTotalTurns(playerIds.length);

    const gameState: GameState = {
      phase: 'idle',
      questionerId: playerIds[0],
      questionerOrder: playerIds,
      currentQuestionerIndex: 0,
      recordingEndTime: null,
      challengeEndTime: null,
    };

    await update(roomRef, {
      status: 'playing',
      currentRound: 1,
      totalRounds: totalTurns,
      gameState,
    });

    return gameState;
  }

  // 게임 상태 업데이트
  async updateGameState(roomId: string, updates: Partial<GameState>): Promise<void> {
    await update(this.getRef(`rooms/${roomId}/gameState`), updates);
  }

  // 녹음 제출
  async submitRecording(roomId: string, questionerId: string, notes: Note[]): Promise<void> {
    await set(this.getRef(`rooms/${roomId}/currentQuestion`), {
      questionerId,
      notes,
      recordedAt: Date.now(),
    });
  }

  // 도전 제출
  async submitChallenge(
    roomId: string,
    odId: string,
    notes: Note[],
    similarity: number,
    similarityDetails?: SimilarityDetails
  ): Promise<void> {
    const challenge: Challenge = {
      odId,
      notes,
      submittedAt: Date.now(),
      similarity,
      similarityDetails,
    };
    await set(this.getRef(`rooms/${roomId}/challenges/${odId}`), challenge);
  }

  // 플레이어 점수 업데이트
  async updatePlayerScore(roomId: string, odId: string, scoreToAdd: number): Promise<void> {
    const playerRef = this.getRef(`rooms/${roomId}/players/${odId}`);
    const snapshot = await get(playerRef);
    const player = snapshot.val() as Player | null;

    if (player) {
      await update(playerRef, { score: player.score + scoreToAdd });
    }
  }

  // 라운드 결과 저장
  async setRoundResult(roomId: string, round: number, result: RoundResult): Promise<void> {
    await set(this.getRef(`rooms/${roomId}/roundResults/${round}`), result);
    await set(this.getRef(`rooms/${roomId}/roundResult`), result);
  }

  // 최종 결과 저장
  async setFinalResult(roomId: string, result: FinalResult): Promise<void> {
    await set(this.getRef(`rooms/${roomId}/finalResult`), result);
    await update(this.getRef(`rooms/${roomId}`), { status: 'finished' });
  }

  // 현재 질문 가져오기
  async getQuestion(roomId: string): Promise<{ questionerId: string; notes: Note[] } | null> {
    const snapshot = await get(this.getRef(`rooms/${roomId}/currentQuestion`));
    return snapshot.val();
  }

  // 방 정보 가져오기
  async getRoom(roomId: string): Promise<Room | null> {
    const snapshot = await get(this.getRef(`rooms/${roomId}`));
    return snapshot.val();
  }

  // 도전들 가져오기
  async getChallenges(roomId: string): Promise<Record<string, Challenge> | null> {
    const snapshot = await get(this.getRef(`rooms/${roomId}/challenges`));
    return snapshot.val();
  }

  // 현재 질문 삭제
  async clearQuestion(roomId: string): Promise<void> {
    await remove(this.getRef(`rooms/${roomId}/currentQuestion`));
  }

  // 도전들 삭제
  async clearChallenges(roomId: string): Promise<void> {
    await remove(this.getRef(`rooms/${roomId}/challenges`));
  }

  // 방 업데이트
  async updateRoom(roomId: string, updates: Partial<Room>): Promise<void> {
    await update(this.getRef(`rooms/${roomId}`), updates);
  }

  // ==================== 합주 모드 ====================

  // 합주 노트 전송
  async playEnsembleNote(
    roomId: string,
    odId: string,
    nickname: string,
    note: string,
    instrument: InstrumentType
  ): Promise<void> {
    const noteRef = push(this.getRef(`rooms/${roomId}/ensembleNotes`));
    await set(noteRef, {
      odId,
      nickname,
      note,
      instrument,
      timestamp: Date.now(),
    });
  }

  // 합주 노트 실시간 구독 (최근 노트만)
  subscribeToEnsembleNotes(
    roomId: string,
    myOdId: string,
    callback: (payload: {
      odId: string;
      nickname: string;
      note: string;
      instrument: InstrumentType;
    }) => void
  ): () => void {
    const notesRef = query(
      this.getRef(`rooms/${roomId}/ensembleNotes`),
      orderByChild('timestamp'),
      limitToLast(1)
    );

    const unsubscribe = onChildAdded(notesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data && data.odId !== myOdId) {
        callback({
          odId: data.odId,
          nickname: data.nickname,
          note: data.note,
          instrument: data.instrument,
        });
      }
    });

    const key = `ensembleNotes:${roomId}`;
    this.subscriptions.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(key);
    };
  }

  // 합주 노트 정리 (오래된 노트 삭제)
  async clearOldEnsembleNotes(roomId: string): Promise<void> {
    await remove(this.getRef(`rooms/${roomId}/ensembleNotes`));
  }

  // 빈 방 정리 (플레이어 없거나 AI만 있는 방 삭제)
  async cleanupEmptyRooms(): Promise<number> {
    const roomsRef = this.getRef('rooms');
    const snapshot = await get(roomsRef);
    const rooms = snapshot.val() as Record<string, Room> | null;

    if (!rooms) return 0;

    let cleanedCount = 0;

    for (const [roomId, room] of Object.entries(rooms)) {
      const players = room.players || {};
      const playerList = Object.values(players);

      // 플레이어가 없거나 AI만 있는 경우
      const realPlayers = playerList.filter((p) => !p.isAI);

      if (playerList.length === 0 || realPlayers.length === 0) {
        await remove(this.getRef(`rooms/${roomId}`));
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

export const firebaseRealtimeService = new FirebaseRealtimeService();
