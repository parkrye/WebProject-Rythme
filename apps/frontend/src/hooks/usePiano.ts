import { useCallback, useRef } from 'react';
import { playNote } from '../utils/audioUtils';
import { useGameStore } from '../stores/useGameStore';
import type { Note } from '@rhythm-game/shared';

export const usePiano = () => {
  const startTimeRef = useRef<number | null>(null);
  const { isRecording, addRecordedNote, addChallengeNote, phase } = useGameStore();

  const handleNotePress = useCallback((note: string) => {
    playNote(note);

    if (!isRecording) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
    const timestamp = Date.now() - startTimeRef.current;

    if (phase === 'recording') {
      addRecordedNote({ note, timestamp });
    } else if (phase === 'challenging') {
      addChallengeNote({ note, timestamp });
    }
  }, [phase, isRecording, addRecordedNote, addChallengeNote]);

  const startRecording = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const stopRecording = useCallback((): Note[] => {
    startTimeRef.current = null;
    return useGameStore.getState().recordedNotes;
  }, []);

  const stopChallenge = useCallback((): Note[] => {
    startTimeRef.current = null;
    return useGameStore.getState().challengeNotes;
  }, []);

  const resetTimer = useCallback(() => {
    startTimeRef.current = null;
  }, []);

  return {
    handleNotePress,
    startRecording,
    stopRecording,
    stopChallenge,
    resetTimer,
  };
};
