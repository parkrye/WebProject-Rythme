import {
  ref,
  onValue,
  DatabaseReference,
  DataSnapshot,
  Unsubscribe,
} from 'firebase/database';
import { getFirebaseDatabase } from '../config/firebase';
import type { Room, RoomSummary } from '@rhythm-game/shared';

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
    callback: SubscriptionCallback<Record<string, { odId: string; notes: { note: string; timestamp: number }[]; similarity: number }>>
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
}

export const firebaseRealtimeService = new FirebaseRealtimeService();
