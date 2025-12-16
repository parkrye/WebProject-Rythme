import { create } from 'zustand';
import {
  DEFAULT_INSTRUMENT,
  type SoloMode,
  type AIDifficulty,
  type InstrumentType,
} from '@rhythm-game/shared';
import type { NoteWithTimestamp } from '../utils/audioUtils';

type SoloPhase =
  | 'mode-select'
  | 'free-play'
  | 'ai-listening'
  | 'ai-challenge'
  | 'recording'
  | 'ai-challenging'
  | 'result';

interface SoloResult {
  similarity: number;
  grade: 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';
  details: {
    noteAccuracy: number;
    noteSequence: number;
    timingAccuracy: number;
    instrumentMatch: number;
    tempoConsistency: number;
    noteCount: number;
  };
}

interface SoloState {
  // 현재 상태
  mode: SoloMode | null;
  phase: SoloPhase;
  difficulty: AIDifficulty;
  instrument: InstrumentType;

  // 멜로디 데이터
  questionMelody: NoteWithTimestamp[];
  answerMelody: NoteWithTimestamp[];
  aiAnswerMelody: NoteWithTimestamp[];

  // 결과
  result: SoloResult | null;
  aiResult: SoloResult | null;

  // 타이머
  remainingTime: number;

  // 액션
  setMode: (mode: SoloMode | null) => void;
  setPhase: (phase: SoloPhase) => void;
  setDifficulty: (difficulty: AIDifficulty) => void;
  setInstrument: (instrument: InstrumentType) => void;
  setQuestionMelody: (melody: NoteWithTimestamp[]) => void;
  setAnswerMelody: (melody: NoteWithTimestamp[]) => void;
  setAiAnswerMelody: (melody: NoteWithTimestamp[]) => void;
  setResult: (result: SoloResult | null) => void;
  setAiResult: (result: SoloResult | null) => void;
  setRemainingTime: (time: number | ((prev: number) => number)) => void;
  reset: () => void;
}

const initialState = {
  mode: null,
  phase: 'mode-select' as SoloPhase,
  difficulty: 'easy' as AIDifficulty,
  instrument: DEFAULT_INSTRUMENT,
  questionMelody: [],
  answerMelody: [],
  aiAnswerMelody: [],
  result: null,
  aiResult: null,
  remainingTime: 0,
};

export const useSoloStore = create<SoloState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),
  setPhase: (phase) => set({ phase }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setInstrument: (instrument) => set({ instrument }),
  setQuestionMelody: (melody) => set({ questionMelody: melody }),
  setAnswerMelody: (melody) => set({ answerMelody: melody }),
  setAiAnswerMelody: (melody) => set({ aiAnswerMelody: melody }),
  setResult: (result) => set({ result }),
  setAiResult: (result) => set({ aiResult: result }),
  setRemainingTime: (time) => set((state) => ({
    remainingTime: typeof time === 'function' ? time(state.remainingTime) : time,
  })),
  reset: () => set(initialState),
}));
