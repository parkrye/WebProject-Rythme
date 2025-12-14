import { create } from 'zustand';
import type { GamePhase, Note, RoundResult, FinalResult } from '@rhythm-game/shared';

interface GameState {
  phase: GamePhase;
  questionerId: string | null;
  questionNotes: Note[];
  recordedNotes: Note[];
  challengeNotes: Note[];
  roundResult: RoundResult | null;
  finalResult: FinalResult | null;
  endTime: number | null;
  isRecording: boolean;

  setPhase: (phase: GamePhase) => void;
  setQuestionerId: (id: string | null) => void;
  setQuestionNotes: (notes: Note[]) => void;
  addRecordedNote: (note: Note) => void;
  clearRecordedNotes: () => void;
  addChallengeNote: (note: Note) => void;
  clearChallengeNotes: () => void;
  setRoundResult: (result: RoundResult | null) => void;
  setFinalResult: (result: FinalResult | null) => void;
  setEndTime: (time: number | null) => void;
  setIsRecording: (isRecording: boolean) => void;
  resetGame: () => void;
}

const initialState = {
  phase: 'idle' as GamePhase,
  questionerId: null,
  questionNotes: [],
  recordedNotes: [],
  challengeNotes: [],
  roundResult: null,
  finalResult: null,
  endTime: null,
  isRecording: false,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setQuestionerId: (id) => set({ questionerId: id }),
  setQuestionNotes: (notes) => set({ questionNotes: notes }),
  addRecordedNote: (note) =>
    set((state) => ({ recordedNotes: [...state.recordedNotes, note] })),
  clearRecordedNotes: () => set({ recordedNotes: [] }),
  addChallengeNote: (note) =>
    set((state) => ({ challengeNotes: [...state.challengeNotes, note] })),
  clearChallengeNotes: () => set({ challengeNotes: [] }),
  setRoundResult: (result) => set({ roundResult: result }),
  setFinalResult: (result) => set({ finalResult: result }),
  setEndTime: (time) => set({ endTime: time }),
  setIsRecording: (isRecording) => set({ isRecording }),
  resetGame: () => set(initialState),
}));
