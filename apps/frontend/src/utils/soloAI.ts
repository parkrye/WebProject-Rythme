import {
  SOLO_CONFIG,
  PIANO_NOTES,
  SIMILARITY_WEIGHTS,
  SCORE_TABLE,
  INSTRUMENTS,
  type AIDifficulty,
  type InstrumentType,
} from '@rhythm-game/shared';
import type { NoteWithTimestamp } from './audioUtils';

// 랜덤 악기 선택
const getRandomInstrument = (): InstrumentType => {
  const instruments = Object.values(INSTRUMENTS);
  return instruments[Math.floor(Math.random() * instruments.length)];
};

// AI 멜로디 생성 (악기 포함)
export const generateAIMelody = (
  difficulty: AIDifficulty,
  instrument?: InstrumentType
): NoteWithTimestamp[] => {
  const config = SOLO_CONFIG.AI_MELODY_PATTERNS[difficulty];
  const noteCount =
    Math.floor(Math.random() * (config.noteCount.max - config.noteCount.min + 1)) +
    config.noteCount.min;

  const selectedInstrument = instrument || getRandomInstrument();
  const melody: NoteWithTimestamp[] = [];
  let currentTime = 0;

  // 시작 음 선택 (C4~G4 범위에서)
  const startNotes = ['C4', 'D4', 'E4', 'F4', 'G4'] as const;
  let currentNoteIndex = (PIANO_NOTES as readonly string[]).indexOf(
    startNotes[Math.floor(Math.random() * startNotes.length)]
  );

  for (let i = 0; i < noteCount; i++) {
    // 음 선택 (순차 진행 위주, 가끔 도약)
    const moveRange = difficulty === 'hard' ? 4 : difficulty === 'normal' ? 3 : 2;
    const move = Math.floor(Math.random() * (moveRange * 2 + 1)) - moveRange;

    currentNoteIndex = Math.max(0, Math.min(PIANO_NOTES.length - 1, currentNoteIndex + move));
    const note = PIANO_NOTES[currentNoteIndex];

    melody.push({
      note,
      timestamp: currentTime,
      instrument: selectedInstrument,
    });

    // 다음 음까지의 간격
    const tempo =
      Math.floor(Math.random() * (config.tempoMs.max - config.tempoMs.min)) +
      config.tempoMs.min;
    currentTime += tempo;
  }

  return melody;
};

// AI 도전 멜로디 생성 (의도적으로 틀림)
export const generateAIChallengeAnswer = (
  original: NoteWithTimestamp[],
  difficulty: AIDifficulty
): NoteWithTimestamp[] => {
  if (original.length === 0) return [];

  // 난이도별 실수 확률
  const mistakeRate = difficulty === 'easy' ? 0.4 : difficulty === 'normal' ? 0.25 : 0.1;
  const timingVariance = difficulty === 'easy' ? 200 : difficulty === 'normal' ? 100 : 50;
  const instrumentMistakeRate = difficulty === 'easy' ? 0.3 : difficulty === 'normal' ? 0.15 : 0.05;

  // 기본 악기 (첫 음의 악기 또는 랜덤)
  const baseInstrument = original[0]?.instrument || getRandomInstrument();
  const useWrongInstrument = Math.random() < instrumentMistakeRate;
  const aiInstrument = useWrongInstrument ? getRandomInstrument() : baseInstrument;

  return original.map((note) => {
    let newNote = note.note;
    let newTimestamp = note.timestamp;

    // 음 실수
    if (Math.random() < mistakeRate) {
      const noteIndex = (PIANO_NOTES as readonly string[]).indexOf(note.note);
      const offset = Math.random() < 0.5 ? -1 : 1;
      const newIndex = Math.max(0, Math.min(PIANO_NOTES.length - 1, noteIndex + offset));
      newNote = PIANO_NOTES[newIndex];
    }

    // 타이밍 오차
    const timingError = (Math.random() - 0.5) * 2 * timingVariance;
    newTimestamp = Math.max(0, note.timestamp + timingError);

    return {
      note: newNote,
      timestamp: newTimestamp,
      instrument: aiInstrument,
    };
  });
};

// 유사도 계산 결과
interface SimilarityResult {
  total: number;
  details: {
    noteAccuracy: number;
    noteSequence: number;
    timingAccuracy: number;
    instrumentMatch: number;
    tempoConsistency: number;
    noteCount: number;
  };
}

// 악기 일치도 계산
const calculateInstrumentMatch = (
  original: NoteWithTimestamp[],
  answer: NoteWithTimestamp[]
): number => {
  if (original.length === 0 || answer.length === 0) return 0;

  // 원본 멜로디의 주 악기
  const originalInstrument = original[0]?.instrument;
  if (!originalInstrument) return 100; // 악기 정보 없으면 100%

  // 응답 멜로디의 악기 일치 비율
  let matchCount = 0;
  answer.forEach((note) => {
    if (note.instrument === originalInstrument) {
      matchCount++;
    }
  });

  return (matchCount / answer.length) * 100;
};

export const calculateSimilarity = (
  original: NoteWithTimestamp[],
  answer: NoteWithTimestamp[]
): SimilarityResult => {
  if (original.length === 0 || answer.length === 0) {
    return {
      total: 0,
      details: {
        noteAccuracy: 0,
        noteSequence: 0,
        timingAccuracy: 0,
        instrumentMatch: 0,
        tempoConsistency: 0,
        noteCount: 0,
      },
    };
  }

  // 1. 음 정확도 (올바른 음 비율)
  const originalNotes = original.map((n) => n.note);
  const answerNotes = answer.map((n) => n.note);
  let correctNotes = 0;
  const minLen = Math.min(originalNotes.length, answerNotes.length);

  for (let i = 0; i < minLen; i++) {
    if (originalNotes[i] === answerNotes[i]) {
      correctNotes++;
    }
  }
  const noteAccuracy = (correctNotes / Math.max(originalNotes.length, answerNotes.length)) * 100;

  // 2. 음 순서 (LCS 기반)
  const lcs = longestCommonSubsequence(originalNotes, answerNotes);
  const noteSequence = (lcs / Math.max(originalNotes.length, answerNotes.length)) * 100;

  // 3. 타이밍 정확도
  let timingScore = 0;
  for (let i = 0; i < minLen; i++) {
    const timeDiff = Math.abs(original[i].timestamp - answer[i].timestamp);
    const maxDiff = 500; // 500ms 이상 차이나면 0점
    timingScore += Math.max(0, 1 - timeDiff / maxDiff);
  }
  const timingAccuracy = minLen > 0 ? (timingScore / minLen) * 100 : 0;

  // 4. 악기 일치도
  const instrumentMatch = calculateInstrumentMatch(original, answer);

  // 5. 템포 유지 (간격 일관성)
  let tempoScore = 0;
  if (original.length > 1 && answer.length > 1) {
    const originalIntervals: number[] = [];
    const answerIntervals: number[] = [];

    for (let i = 1; i < original.length; i++) {
      originalIntervals.push(original[i].timestamp - original[i - 1].timestamp);
    }
    for (let i = 1; i < answer.length; i++) {
      answerIntervals.push(answer[i].timestamp - answer[i - 1].timestamp);
    }

    const minIntervals = Math.min(originalIntervals.length, answerIntervals.length);
    for (let i = 0; i < minIntervals; i++) {
      const ratio = Math.min(originalIntervals[i], answerIntervals[i]) /
        Math.max(originalIntervals[i], answerIntervals[i]);
      tempoScore += ratio;
    }
    tempoScore = minIntervals > 0 ? (tempoScore / minIntervals) * 100 : 0;
  }
  const tempoConsistency = tempoScore;

  // 6. 음 개수
  const countRatio = Math.min(original.length, answer.length) /
    Math.max(original.length, answer.length);
  const noteCount = countRatio * 100;

  // 가중치 적용 총점
  const total =
    noteAccuracy * SIMILARITY_WEIGHTS.NOTE_ACCURACY +
    noteSequence * SIMILARITY_WEIGHTS.NOTE_SEQUENCE +
    timingAccuracy * SIMILARITY_WEIGHTS.TIMING_ACCURACY +
    instrumentMatch * SIMILARITY_WEIGHTS.INSTRUMENT_MATCH +
    tempoConsistency * SIMILARITY_WEIGHTS.TEMPO_CONSISTENCY +
    noteCount * SIMILARITY_WEIGHTS.NOTE_COUNT;

  return {
    total: Math.round(total * 10) / 10,
    details: {
      noteAccuracy: Math.round(noteAccuracy * 10) / 10,
      noteSequence: Math.round(noteSequence * 10) / 10,
      timingAccuracy: Math.round(timingAccuracy * 10) / 10,
      instrumentMatch: Math.round(instrumentMatch * 10) / 10,
      tempoConsistency: Math.round(tempoConsistency * 10) / 10,
      noteCount: Math.round(noteCount * 10) / 10,
    },
  };
};

// LCS (최장 공통 부분 수열)
const longestCommonSubsequence = (a: string[], b: string[]): number => {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
};

// 등급 판정
export const getGrade = (similarity: number): 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS' => {
  if (similarity >= SCORE_TABLE.PERFECT.threshold) return 'PERFECT';
  if (similarity >= SCORE_TABLE.GREAT.threshold) return 'GREAT';
  if (similarity >= SCORE_TABLE.GOOD.threshold) return 'GOOD';
  return 'MISS';
};
