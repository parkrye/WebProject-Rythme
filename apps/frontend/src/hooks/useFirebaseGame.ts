import { useEffect } from 'react';
import { firebaseRealtimeService } from '../services/firebaseRealtimeService';
import { useGameStore } from '../stores/useGameStore';
import type { RoundResult, FinalResult } from '@rhythm-game/shared';

export const useFirebaseGameState = (roomId: string | null) => {
  const {
    setPhase,
    setQuestionerId,
    setEndTime,
  } = useGameStore();

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = firebaseRealtimeService.subscribeToGameState(
      roomId,
      (gameState) => {
        if (gameState) {
          setPhase(gameState.phase);
          setQuestionerId(gameState.questionerId);

          if (gameState.phase === 'recording' && gameState.recordingEndTime) {
            setEndTime(gameState.recordingEndTime);
          } else if (gameState.phase === 'challenging' && gameState.challengeEndTime) {
            setEndTime(gameState.challengeEndTime);
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomId, setPhase, setQuestionerId, setEndTime]);
};

export const useFirebaseQuestion = (roomId: string | null) => {
  const { setQuestionNotes } = useGameStore();

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = firebaseRealtimeService.subscribeToQuestion(
      roomId,
      (question) => {
        if (question && question.notes) {
          setQuestionNotes(question.notes);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomId, setQuestionNotes]);
};

export const useFirebaseRoundResult = (roomId: string | null) => {
  const { setRoundResult } = useGameStore();

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = firebaseRealtimeService.subscribeToRoundResult(
      roomId,
      (result) => {
        if (result) {
          setRoundResult(result as unknown as RoundResult);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomId, setRoundResult]);
};

export const useFirebaseFinalResult = (roomId: string | null) => {
  const { setFinalResult } = useGameStore();

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = firebaseRealtimeService.subscribeToFinalResult(
      roomId,
      (result) => {
        if (result) {
          setFinalResult(result as unknown as FinalResult);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomId, setFinalResult]);
};

// 통합 훅: 게임 관련 모든 Firebase 구독
export const useFirebaseGameSync = (roomId: string | null) => {
  useFirebaseGameState(roomId);
  useFirebaseQuestion(roomId);
  useFirebaseRoundResult(roomId);
  useFirebaseFinalResult(roomId);
};
