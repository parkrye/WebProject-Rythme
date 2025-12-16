import { useCallback, useRef } from 'react';
import { playNote as playNoteWithInstrument } from '../utils/audioUtils';
import { useGameStore } from '../stores/useGameStore';
import { DEFAULT_INSTRUMENT, type Note, type InstrumentType } from '@rhythm-game/shared';

export const usePiano = () => {
  const startTimeRef = useRef<number | null>(null);
  const { isRecording, addRecordedNote, addChallengeNote, phase } = useGameStore();

  // playNote 함수 반환 (악기 지원)
  const playNote = useCallback(
    (note: string, duration: number = 0.5, instrument: InstrumentType = DEFAULT_INSTRUMENT) => {
      playNoteWithInstrument(note, duration, instrument);
    },
    []
  );

  const handleNotePress = useCallback((note: string) => {
    playNoteWithInstrument(note);

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
    playNote,
    handleNotePress,
    startRecording,
    stopRecording,
    stopChallenge,
    resetTimer,
  };
};
