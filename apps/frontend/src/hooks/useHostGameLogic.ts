import { useEffect, useRef, useCallback } from 'react';
import { firebaseRealtimeService } from '../services/firebaseRealtimeService';
import {
  generateAIMelody,
  generateAIChallengeAnswer,
  calculateSimilarity,
  getGrade,
} from '../utils/soloAI';
import type {
  Note,
  RoundResult,
  FinalResult,
  PlayerRanking,
} from '@rhythm-game/shared';
import { GAME_CONFIG, SCORE_TABLE } from '@rhythm-game/shared';

interface UseHostGameLogicProps {
  roomId: string;
  isHost: boolean;
}

export const useHostGameLogic = ({ roomId, isHost }: UseHostGameLogicProps) => {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const addTimer = useCallback((timer: ReturnType<typeof setTimeout>) => {
    timersRef.current.push(timer);
  }, []);

  // 녹음 페이즈 시작
  const startRecording = useCallback(async () => {
    if (!isHost) return;

    const room = await firebaseRealtimeService.getRoom(roomId);
    if (!room || !room.gameState) return;

    const currentQuestionerId = room.gameState.questionerId;
    const questioner = room.players[currentQuestionerId];
    const recordingEndTime = Date.now() + GAME_CONFIG.RECORDING_TIME_MS;

    await firebaseRealtimeService.updateGameState(roomId, {
      phase: 'recording',
      recordingEndTime,
    });

    // AI 출제자인 경우 자동으로 멜로디 생성
    if (questioner?.isAI) {
      const aiTimer = setTimeout(async () => {
        const aiMelody = generateAIMelody('normal');
        const notes: Note[] = aiMelody.map((n) => ({
          note: n.note,
          timestamp: n.timestamp,
        }));
        await firebaseRealtimeService.submitRecording(roomId, currentQuestionerId, notes);
      }, 1000);
      addTimer(aiTimer);
    }

    // 녹음 시간 후 듣기 페이즈로
    const timer = setTimeout(() => {
      startListening();
    }, GAME_CONFIG.RECORDING_TIME_MS);
    addTimer(timer);
  }, [isHost, roomId, addTimer]);

  // 듣기 페이즈 시작
  const startListening = useCallback(async () => {
    if (!isHost) return;

    const question = await firebaseRealtimeService.getQuestion(roomId);
    if (!question || question.notes.length === 0) {
      // 출제가 없으면 바로 도전 페이즈로
      startChallenge();
      return;
    }

    await firebaseRealtimeService.updateGameState(roomId, {
      phase: 'listening',
    });

    // 듣기 시간 후 도전 페이즈로
    const timer = setTimeout(() => {
      startChallenge();
    }, GAME_CONFIG.LISTENING_TIME_MS);
    addTimer(timer);
  }, [isHost, roomId, addTimer]);

  // 도전 페이즈 시작
  const startChallenge = useCallback(async () => {
    if (!isHost) return;

    const room = await firebaseRealtimeService.getRoom(roomId);
    if (!room || !room.gameState) return;

    const challengeEndTime = Date.now() + GAME_CONFIG.CHALLENGE_TIME_MS;

    // 이전 도전 기록 삭제
    await firebaseRealtimeService.clearChallenges(roomId);

    await firebaseRealtimeService.updateGameState(roomId, {
      phase: 'challenging',
      challengeEndTime,
    });

    // AI 도전자들 처리
    const question = await firebaseRealtimeService.getQuestion(roomId);
    if (question) {
      const questionerId = room.gameState.questionerId;
      const aiChallengers = Object.values(room.players).filter(
        (p) => p.isAI && p.odId !== questionerId
      );

      for (const ai of aiChallengers) {
        const delay = 2000 + Math.random() * 5000;
        const aiTimer = setTimeout(async () => {
          const questionNotes = question.notes.map((n) => ({
            note: n.note,
            timestamp: n.timestamp,
            instrument: 'piano' as const,
          }));
          const aiAnswer = generateAIChallengeAnswer(questionNotes, 'easy');
          const aiNotes: Note[] = aiAnswer.map((n) => ({
            note: n.note,
            timestamp: n.timestamp,
          }));
          const result = calculateSimilarity(questionNotes, aiAnswer);
          await firebaseRealtimeService.submitChallenge(roomId, ai.odId, aiNotes, result.total);
        }, delay);
        addTimer(aiTimer);
      }
    }

    // 도전 시간 후 판정
    const timer = setTimeout(() => {
      judgeRound();
    }, GAME_CONFIG.CHALLENGE_TIME_MS);
    addTimer(timer);
  }, [isHost, roomId, addTimer]);

  // 라운드 판정
  const judgeRound = useCallback(async () => {
    if (!isHost) return;

    const room = await firebaseRealtimeService.getRoom(roomId);
    if (!room || !room.gameState) return;

    await firebaseRealtimeService.updateGameState(roomId, {
      phase: 'judging',
    });

    const challenges = await firebaseRealtimeService.getChallenges(roomId);
    const question = await firebaseRealtimeService.getQuestion(roomId);
    const questionNotes = question?.notes || [];

    let winnerId: string | null = null;
    let winnerSimilarity = 0;
    let winnerNotes: Note[] = [];

    if (challenges) {
      const sorted = Object.values(challenges).sort((a, b) => b.similarity - a.similarity);
      if (sorted.length > 0) {
        winnerId = sorted[0].odId;
        winnerSimilarity = sorted[0].similarity;
        winnerNotes = sorted[0].notes;
      }
    }

    const grade = getGrade(winnerSimilarity);
    const score = SCORE_TABLE[grade].score;
    const questionerId = room.gameState.questionerId;

    // 점수 업데이트
    if (winnerId) {
      await firebaseRealtimeService.updatePlayerScore(roomId, winnerId, score);
      await firebaseRealtimeService.updatePlayerScore(roomId, questionerId, score);
    } else {
      await firebaseRealtimeService.updatePlayerScore(roomId, questionerId, SCORE_TABLE.NO_CHALLENGER.score);
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

    await firebaseRealtimeService.setRoundResult(roomId, room.currentRound, result);
    await firebaseRealtimeService.updateGameState(roomId, { phase: 'result' });

    // 결과 표시 후 다음 라운드 또는 종료
    const timer = setTimeout(() => {
      nextRoundOrEnd();
    }, GAME_CONFIG.RESULT_TIME_MS);
    addTimer(timer);
  }, [isHost, roomId, addTimer]);

  // 다음 라운드 또는 게임 종료
  const nextRoundOrEnd = useCallback(async () => {
    if (!isHost) return;

    const room = await firebaseRealtimeService.getRoom(roomId);
    if (!room || !room.gameState) return;

    const nextRound = room.currentRound + 1;

    if (nextRound > room.totalRounds) {
      // 게임 종료
      await endGame();
      return;
    }

    // 다음 라운드
    const nextIndex =
      (room.gameState.currentQuestionerIndex + 1) %
      room.gameState.questionerOrder.length;
    const nextQuestionerId = room.gameState.questionerOrder[nextIndex];

    await firebaseRealtimeService.updateRoom(roomId, { currentRound: nextRound });
    await firebaseRealtimeService.updateGameState(roomId, {
      phase: 'idle',
      questionerId: nextQuestionerId,
      currentQuestionerIndex: nextIndex,
      recordingEndTime: null,
      challengeEndTime: null,
    });

    await firebaseRealtimeService.clearQuestion(roomId);
    await firebaseRealtimeService.clearChallenges(roomId);

    // idle 후 녹음 페이즈 시작
    const timer = setTimeout(() => {
      startRecording();
    }, GAME_CONFIG.IDLE_TIME_MS);
    addTimer(timer);
  }, [isHost, roomId, addTimer, startRecording]);

  // 게임 종료
  const endGame = useCallback(async () => {
    if (!isHost) return;

    const room = await firebaseRealtimeService.getRoom(roomId);
    if (!room) return;

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

    const finalResult: FinalResult = {
      rankings,
      winner: rankings[0],
    };

    await firebaseRealtimeService.setFinalResult(roomId, finalResult);
  }, [isHost, roomId]);

  // 게임 시작 (외부에서 호출)
  const handleStartGame = useCallback(async () => {
    if (!isHost) return;

    const gameState = await firebaseRealtimeService.startGame(roomId);
    if (!gameState) return; // 합주 모드인 경우

    // idle 후 녹음 페이즈 시작
    const timer = setTimeout(() => {
      startRecording();
    }, GAME_CONFIG.IDLE_TIME_MS);
    addTimer(timer);
  }, [isHost, roomId, addTimer, startRecording]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    handleStartGame,
  };
};
