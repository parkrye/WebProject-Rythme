import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../services/firebase.service';
import { ScoreService } from '../../services/score.service';
import { RoomService } from '../room/room.service';
import type {
  Room,
  GameState,
  Note,
  Challenge,
  RoundResult,
  FinalResult,
  PlayerRanking,
} from '@rhythm-game/shared';
import { GAME_CONFIG, calculateTotalTurns } from '@rhythm-game/shared';

@Injectable()
export class GameService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly scoreService: ScoreService,
    private readonly roomService: RoomService,
  ) {}

  async startGame(roomId: string): Promise<GameState | null> {
    const room = await this.roomService.getRoom(roomId);
    if (!room) return null;

    const playerIds = Object.keys(room.players);
    const totalTurns = calculateTotalTurns(playerIds.length);

    const gameState: GameState = {
      phase: 'idle',
      questionerId: playerIds[0],
      questionerOrder: playerIds,
      currentQuestionerIndex: 0,
      recordingEndTime: null,
      challengeEndTime: null,
    };

    await this.roomService.updateRoom(roomId, {
      status: 'playing',
      currentRound: 1,
      totalRounds: totalTurns,
      gameState,
    });

    return gameState;
  }

  async startRecordingPhase(roomId: string): Promise<number> {
    const endTime = Date.now() + GAME_CONFIG.RECORDING_TIME_MS;

    await this.firebase.update(`rooms/${roomId}/gameState`, {
      phase: 'recording',
      recordingEndTime: endTime,
    });

    return endTime;
  }

  async submitRecording(roomId: string, notes: Note[]): Promise<void> {
    const room = await this.roomService.getRoom(roomId);
    if (!room || !room.gameState) return;

    await this.firebase.set(`rooms/${roomId}/currentQuestion`, {
      questionerId: room.gameState.questionerId,
      notes,
      recordedAt: Date.now(),
    });
  }

  async getQuestion(roomId: string): Promise<{ notes: Note[] } | null> {
    return this.firebase.get<{ notes: Note[] }>(`rooms/${roomId}/currentQuestion`);
  }

  async startListeningPhase(roomId: string): Promise<number> {
    const endTime = Date.now() + GAME_CONFIG.LISTENING_TIME_MS;

    await this.firebase.update(`rooms/${roomId}/gameState`, {
      phase: 'listening',
    });

    return endTime;
  }

  async startChallengePhase(roomId: string): Promise<number> {
    const endTime = Date.now() + GAME_CONFIG.CHALLENGE_TIME_MS;

    await this.firebase.update(`rooms/${roomId}/gameState`, {
      phase: 'challenging',
      challengeEndTime: endTime,
    });

    await this.firebase.remove(`rooms/${roomId}/challenges`);

    return endTime;
  }

  async submitChallenge(
    roomId: string,
    odId: string,
    notes: Note[],
  ): Promise<void> {
    const room = await this.roomService.getRoom(roomId);
    if (!room) return;

    const question = await this.firebase.get<{ notes: Note[] }>(
      `rooms/${roomId}/currentQuestion`,
    );
    if (!question) return;

    const similarity = this.scoreService.calculateSimilarity(
      question.notes,
      notes,
    );

    const challenge: Challenge = {
      odId,
      notes,
      submittedAt: Date.now(),
      similarity,
    };

    await this.firebase.set(`rooms/${roomId}/challenges/${odId}`, challenge);
  }

  async judgeRound(roomId: string): Promise<RoundResult | null> {
    const room = await this.roomService.getRoom(roomId);
    if (!room || !room.gameState) return null;

    await this.firebase.update(`rooms/${roomId}/gameState`, {
      phase: 'judging',
    });

    const challenges = await this.firebase.get<Record<string, Challenge>>(
      `rooms/${roomId}/challenges`,
    );

    const question = await this.getQuestion(roomId);
    const questionNotes = question?.notes || [];

    let winnerId: string | null = null;
    let winnerSimilarity = 0;
    let winnerNotes: Note[] = [];

    if (challenges) {
      const sorted = Object.values(challenges).sort(
        (a, b) => b.similarity - a.similarity,
      );
      if (sorted.length > 0) {
        winnerId = sorted[0].odId;
        winnerSimilarity = sorted[0].similarity;
        winnerNotes = sorted[0].notes;
      }
    }

    const grade = this.scoreService.getGrade(winnerSimilarity);
    const score = this.scoreService.getScore(grade);

    const questionerId = room.gameState.questionerId;

    if (winnerId) {
      await this.firebase.update(`rooms/${roomId}/players/${winnerId}`, {
        score: (room.players[winnerId]?.score || 0) + score,
      });
      await this.firebase.update(`rooms/${roomId}/players/${questionerId}`, {
        score: (room.players[questionerId]?.score || 0) + score,
      });
    } else {
      await this.firebase.update(`rooms/${roomId}/players/${questionerId}`, {
        score: (room.players[questionerId]?.score || 0) + 20,
      });
    }

    const result: RoundResult = {
      round: room.currentRound,
      questionerId,
      winnerId,
      winnerSimilarity,
      questionerScore: score,
      winnerScore: winnerId ? score : 0,
      grade,
      questionNotes,
      winnerNotes,
    };

    await this.firebase.set(
      `rooms/${roomId}/roundResults/${room.currentRound}`,
      result,
    );

    return result;
  }

  async showResult(roomId: string): Promise<void> {
    await this.firebase.update(`rooms/${roomId}/gameState`, {
      phase: 'result',
    });
  }

  async nextRound(roomId: string): Promise<boolean> {
    const room = await this.roomService.getRoom(roomId);
    if (!room || !room.gameState) return false;

    const nextRound = room.currentRound + 1;

    if (nextRound > room.totalRounds) {
      return false;
    }

    const nextIndex =
      (room.gameState.currentQuestionerIndex + 1) %
      room.gameState.questionerOrder.length;
    const nextQuestionerId = room.gameState.questionerOrder[nextIndex];

    await this.roomService.updateRoom(roomId, {
      currentRound: nextRound,
    });

    await this.firebase.update(`rooms/${roomId}/gameState`, {
      phase: 'idle',
      questionerId: nextQuestionerId,
      currentQuestionerIndex: nextIndex,
      recordingEndTime: null,
      challengeEndTime: null,
    });

    await this.firebase.remove(`rooms/${roomId}/currentQuestion`);
    await this.firebase.remove(`rooms/${roomId}/challenges`);

    return true;
  }

  async endGame(roomId: string): Promise<FinalResult | null> {
    const room = await this.roomService.getRoom(roomId);
    if (!room) return null;

    const players = Object.values(room.players);
    const sortedPlayers = players.sort((a, b) => b.score - a.score);

    const rankings: PlayerRanking[] = sortedPlayers.map((player, index) => ({
      odId: player.odId,
      nickname: player.nickname,
      score: player.score,
      rank: index + 1,
      perfectCount: 0,
      winCount: 0,
    }));

    const result: FinalResult = {
      rankings,
      winner: rankings[0],
    };

    await this.roomService.updateRoom(roomId, {
      status: 'finished',
    });

    return result;
  }
}
