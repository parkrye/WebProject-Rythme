import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import { useUserStore } from '../stores/useUserStore';
import { useRoomStore } from '../stores/useRoomStore';
import { useGameStore } from '../stores/useGameStore';
import type { RoomMode, InstrumentType, EnsembleNotePlayPayload } from '@rhythm-game/shared';

export const useSocket = () => {
  const odId = useUserStore((state) => state.odId);
  const { setRooms, setCurrentRoom, updateRoom, addPlayer, removePlayer } = useRoomStore();
  const { setPhase, setQuestionerId, setQuestionNotes, setRoundResult, setFinalResult, setEndTime } = useGameStore();
  const ensembleNoteCallbackRef = useRef<((payload: EnsembleNotePlayPayload) => void) | null>(null);

  useEffect(() => {
    if (!odId) return;

    socketService.connect(odId);

    socketService.on('room:list', setRooms);
    socketService.on('room:created', setCurrentRoom);
    socketService.on('room:updated', updateRoom);
    socketService.on('room:playerJoined', addPlayer);
    socketService.on('room:playerLeft', ({ odId }) => removePlayer(odId));

    socketService.on('game:phaseChanged', ({ phase, questionerId, endTime }) => {
      setPhase(phase);
      if (questionerId) setQuestionerId(questionerId);
      if (endTime) setEndTime(endTime);
    });

    socketService.on('game:questionReady', ({ notes }) => {
      setQuestionNotes(notes);
    });

    socketService.on('game:playQuestion', ({ notes }) => {
      setQuestionNotes(notes);
    });

    socketService.on('game:roundResult', setRoundResult);
    socketService.on('game:finalResult', setFinalResult);

    socketService.on('ensemble:notePlay', (payload) => {
      if (ensembleNoteCallbackRef.current) {
        ensembleNoteCallbackRef.current(payload);
      }
    });

    socketService.on('error', ({ code, message }) => {
      console.error(`Error [${code}]: ${message}`);
    });

    return () => {
      socketService.off('room:list');
      socketService.off('room:created');
      socketService.off('room:updated');
      socketService.off('room:playerJoined');
      socketService.off('room:playerLeft');
      socketService.off('game:phaseChanged');
      socketService.off('game:questionReady');
      socketService.off('game:playQuestion');
      socketService.off('game:roundResult');
      socketService.off('game:finalResult');
      socketService.off('ensemble:notePlay');
      socketService.off('error');
    };
  }, [odId, setRooms, setCurrentRoom, updateRoom, addPlayer, removePlayer, setPhase, setQuestionerId, setQuestionNotes, setRoundResult, setFinalResult, setEndTime]);

  const setEnsembleNoteCallback = useCallback((callback: ((payload: EnsembleNotePlayPayload) => void) | null) => {
    ensembleNoteCallbackRef.current = callback;
  }, []);

  const createRoom = useCallback((name: string, maxPlayers: number, mode: RoomMode) => {
    socketService.emit('room:create', { name, maxPlayers, mode });
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socketService.emit('room:join', { roomId });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketService.emit('room:leave', { roomId });
  }, []);

  const setReady = useCallback((roomId: string, isReady: boolean) => {
    socketService.emit('room:ready', { roomId, isReady });
  }, []);

  const startGame = useCallback((roomId: string) => {
    socketService.emit('game:start', { roomId });
  }, []);

  const submitRecording = useCallback((roomId: string, notes: { note: string; timestamp: number }[]) => {
    socketService.emit('game:submitRecording', { roomId, notes });
  }, []);

  const submitChallenge = useCallback((roomId: string, notes: { note: string; timestamp: number }[]) => {
    socketService.emit('game:submitChallenge', { roomId, notes });
  }, []);

  const addAI = useCallback((roomId: string, difficulty: 'easy' | 'normal' | 'hard' = 'easy') => {
    socketService.emit('room:addAI', { roomId, difficulty });
  }, []);

  const playNoteInRoom = useCallback((roomId: string, note: string, instrument: InstrumentType) => {
    socketService.emit('ensemble:playNote', { roomId, note, instrument });
  }, []);

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    submitRecording,
    submitChallenge,
    addAI,
    playNoteInRoom,
    setEnsembleNoteCallback,
  };
};
