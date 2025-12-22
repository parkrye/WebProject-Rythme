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
  Challenge,
  InstrumentType,
} from '@rhythm-game/shared';
import { GAME_CONFIG, SCORE_TABLE, INSTRUMENTS } from '@rhythm-game/shared';

// 랜덤 악기 선택
const getRandomInstrument = (): InstrumentType => {
  const instruments = Object.values(INSTRUMENTS);
  return instruments[Math.floor(Math.random() * instruments.length)] as InstrumentType;
};

interface UseHostGameLogicProps {
  roomId: string;
  isHost: boolean;
}

// 현재 페이즈를 추적하기 위한 타입
type PhaseTimerKey = 'recording' | 'listening' | 'challenging' | 'result';

export const useHostGameLogic = ({ roomId, isHost }: UseHostGameLogicProps) => {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseTimersRef = useRef<Map<PhaseTimerKey, ReturnType<typeof setTimeout>>>(new Map());
  const currentPhaseRef = useRef<string>('idle');
  const unsubscribeChallengesRef = useRef<(() => void) | null>(null);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
    phaseTimersRef.current.forEach((timer) => clearTimeout(timer));
    phaseTimersRef.current.clear();
  }, []);

  const addTimer = useCallback((timer: ReturnType<typeof setTimeout>) => {
    timersRef.current.push(timer);
  }, []);

  const setPhaseTimer = useCallback((phase: PhaseTimerKey, timer: ReturnType<typeof setTimeout>) => {
    // 기존 타이머 취소
    const existingTimer = phaseTimersRef.current.get(phase);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    phaseTimersRef.current.set(phase, timer);
  }, []);

  const clearPhaseTimer = useCallback((phase: PhaseTimerKey) => {
    const timer = phaseTimersRef.current.get(phase);
    if (timer) {
      clearTimeout(timer);
      phaseTimersRef.current.delete(phase);
    }
  }, []);

  // 녹음 페이즈 시작
  const startRecording = useCallback(async () => {
    if (!isHost) return;

    const room = await firebaseRealtimeService.getRoom(roomId);
    if (!room || !room.gameState) return;

    currentPhaseRef.current = 'recording';
    const currentQuestionerId = room.gameState.questionerId;
    const questioner = room.players[currentQuestionerId];
    const recordingEndTime = Date.now() + GAME_CONFIG.RECORDING_TIME_MS;

    await firebaseRealtimeService.updateGameState(roomId, {
      phase: 'recording',
      recordingEndTime,
    });

    // AI 출제자인 경우 자동으로 멜로디 생성 후 바로 제출
    if (questioner?.isAI) {
      const aiTimer = setTimeout(async () => {
        const aiMelody = generateAIMelody('normal');
        const notes: Note[] = aiMelody.map((n) => ({
          note: n.note,
          timestamp: n.timestamp,
        }));
        await firebaseRealtimeService.submitRecording(roomId, currentQuestionerId, notes);
        // AI는 바로 다음 페이즈로 이동
        clearPhaseTimer('recording');
        startListening();
      }, 1000);
      addTimer(aiTimer);
    }

    // 녹음 시간 후 듣기 페이즈로
    const timer = setTimeout(() => {
      startListening();
    }, GAME_CONFIG.RECORDING_TIME_MS);
    setPhaseTimer('recording', timer);
  }, [isHost, roomId, addTimer, setPhaseTimer, clearPhaseTimer]);

  // 출제자가 녹음 제출 시 호출 (조기 종료)
  const submitRecordingEarly = useCallback(async () => {
    if (!isHost) return;
    if (currentPhaseRef.current !== 'recording') return;

    // 녹음 타이머 취소하고 바로 듣기 페이즈로
    clearPhaseTimer('recording');
    await startListening();
  }, [isHost, clearPhaseTimer]);

  // 듣기 페이즈 시작
  const startListening = useCallback(async () => {
    if (!isHost) return;

    currentPhaseRef.current = 'listening';
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
    setPhaseTimer('listening', timer);
  }, [isHost, roomId, setPhaseTimer]);

  // 도전 페이즈 시작
  const startChallenge = useCallback(async () => {
    if (!isHost) return;

    const room = await firebaseRealtimeService.getRoom(roomId);
    if (!room || !room.gameState) return;

    currentPhaseRef.current = 'challenging';
    const challengeEndTime = Date.now() + GAME_CONFIG.CHALLENGE_TIME_MS;

    // 이전 도전 기록 삭제
    await firebaseRealtimeService.clearChallenges(roomId);

    await firebaseRealtimeService.updateGameState(roomId, {
      phase: 'challenging',
      challengeEndTime,
    });

    const questionerId = room.gameState.questionerId;

    // 실제 플레이어 도전자 목록 (출제자 제외, AI 제외)
    const realChallengers = Object.values(room.players).filter(
      (p) => !p.isAI && p.odId !== questionerId
    );
    const realChallengerIds = new Set(realChallengers.map((p) => p.odId));
    const totalRealChallengers = realChallengers.length;

    // AI 도전자들 처리
    const question = await firebaseRealtimeService.getQuestion(roomId);
    if (question) {
      const aiChallengers = Object.values(room.players).filter(
        (p) => p.isAI && p.odId !== questionerId
      );

      for (const ai of aiChallengers) {
        const delay = 2000 + Math.random() * 5000;
        const aiTimer = setTimeout(async () => {
          // AI는 출제자의 악기를 랜덤하게 인식 (또는 실제 악기 정보가 있으면 사용)
          const aiPerceiveInstrument = getRandomInstrument();
          const questionNotes = question.notes.map((n) => ({
            note: n.note,
            timestamp: n.timestamp,
            instrument: aiPerceiveInstrument,
          }));
          // AI 도전자도 자신만의 악기를 선택 (generateAIChallengeAnswer 내부에서 처리)
          const aiAnswer = generateAIChallengeAnswer(questionNotes, 'easy');
          const aiNotes: Note[] = aiAnswer.map((n) => ({
            note: n.note,
            timestamp: n.timestamp,
          }));
          const result = calculateSimilarity(questionNotes, aiAnswer);
          await firebaseRealtimeService.submitChallenge(
            roomId,
            ai.odId,
            aiNotes,
            result.total,
            result.details
          );
        }, delay);
        addTimer(aiTimer);
      }
    }

    // 도전 제출 모니터링 (실제 플레이어만 카운팅)
    // 실제 플레이어가 없으면 (AI만 있으면) 바로 종료
    if (totalRealChallengers === 0) {
      // AI만 있으면 AI 응답 시간 + 약간의 여유 후 종료
      const timer = setTimeout(() => {
        judgeRound();
      }, 8000); // AI 최대 응답 시간 + 여유
      setPhaseTimer('challenging', timer);
    } else {
      // 실제 플레이어가 있으면 도전 제출 모니터링
      const unsubscribe = firebaseRealtimeService.subscribeToChallenges(
        roomId,
        (challenges: Record<string, Challenge> | null) => {
          if (currentPhaseRef.current !== 'challenging') return;
          if (!challenges) return;

          // 제출한 실제 플레이어 수 카운팅
          const submittedRealPlayers = Object.keys(challenges).filter((id) =>
            realChallengerIds.has(id)
          );

          // 모든 실제 플레이어가 제출했으면 조기 종료
          if (submittedRealPlayers.length >= totalRealChallengers) {
            clearPhaseTimer('challenging');
            unsubscribeChallengesRef.current?.();
            unsubscribeChallengesRef.current = null;
            judgeRound();
          }
        }
      );
      unsubscribeChallengesRef.current = unsubscribe;

      // 도전 시간 후 판정 (타임아웃)
      const timer = setTimeout(() => {
        unsubscribeChallengesRef.current?.();
        unsubscribeChallengesRef.current = null;
        judgeRound();
      }, GAME_CONFIG.CHALLENGE_TIME_MS);
      setPhaseTimer('challenging', timer);
    }
  }, [isHost, roomId, addTimer, setPhaseTimer, clearPhaseTimer]);

  // 라운드 판정
  const judgeRound = useCallback(async () => {
    if (!isHost) return;

    currentPhaseRef.current = 'judging';
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
    let winnerSimilarityDetails = undefined;

    if (challenges) {
      const sorted = Object.values(challenges).sort((a, b) => b.similarity - a.similarity);
      if (sorted.length > 0) {
        winnerId = sorted[0].odId;
        winnerSimilarity = sorted[0].similarity;
        winnerNotes = sorted[0].notes;
        winnerSimilarityDetails = sorted[0].similarityDetails;
      }
    }

    const grade = getGrade(winnerSimilarity);
    // 점수에 정확도 배수 적용 (예: 80% 정확도 = 0.8배 점수)
    const baseScore = SCORE_TABLE[grade].score;
    const accuracyMultiplier = winnerSimilarity / 100;
    const score = Math.round(baseScore * accuracyMultiplier);
    const questionerId = room.gameState.questionerId;

    // 점수 업데이트
    if (winnerId) {
      await firebaseRealtimeService.updatePlayerScore(roomId, winnerId, score);
      await firebaseRealtimeService.updatePlayerScore(roomId, questionerId, score);
    } else {
      // 도전자가 없으면 출제자에게 기본 점수 (배수 없음)
      await firebaseRealtimeService.updatePlayerScore(roomId, questionerId, SCORE_TABLE.NO_CHALLENGER.score);
    }

    const result: RoundResult = {
      round: room.currentRound,
      questionerId,
      winnerId,
      winnerSimilarity,
      winnerSimilarityDetails,
      questionerScore: score,
      winnerScore: winnerId ? score : 0,
      grade,
      questionNotes,
      winnerNotes,
    };

    await firebaseRealtimeService.setRoundResult(roomId, room.currentRound, result);
    await firebaseRealtimeService.updateGameState(roomId, { phase: 'result' });

    currentPhaseRef.current = 'result';

    // 결과 표시 후 다음 라운드 또는 종료
    const timer = setTimeout(() => {
      nextRoundOrEnd();
    }, GAME_CONFIG.RESULT_TIME_MS);
    setPhaseTimer('result', timer);
  }, [isHost, roomId, setPhaseTimer]);

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

  // 컴포넌트 언마운트 시 타이머 및 구독 정리
  useEffect(() => {
    return () => {
      clearAllTimers();
      unsubscribeChallengesRef.current?.();
      unsubscribeChallengesRef.current = null;
    };
  }, [clearAllTimers]);

  return {
    handleStartGame,
    submitRecordingEarly,
  };
};
