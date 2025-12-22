export type GamePhase = 'idle' | 'recording' | 'listening' | 'challenging' | 'judging' | 'result';

export type ScoreGrade = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export interface Note {
  note: string;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  questionerId: string;
  questionerOrder: string[];
  currentQuestionerIndex: number;
  recordingEndTime: number | null;
  challengeEndTime: number | null;
}

export interface Question {
  questionerId: string;
  notes: Note[];
  recordedAt: number;
}

export interface Challenge {
  odId: string;
  notes: Note[];
  submittedAt: number;
  similarity: number;
  similarityDetails?: SimilarityDetails;
}

export interface SimilarityDetails {
  noteAccuracy: number;
  noteSequence: number;
  timingAccuracy: number;
  instrumentMatch: number;
  tempoConsistency: number;
  noteCount: number;
}

export interface RoundResult {
  round: number;
  questionerId: string;
  winnerId: string | null;
  winnerSimilarity: number;
  winnerSimilarityDetails?: SimilarityDetails;
  questionerScore: number;
  winnerScore: number;
  grade: ScoreGrade;
  questionNotes: Note[];
  winnerNotes: Note[];
}

export interface FinalResult {
  rankings: PlayerRanking[];
  winner: PlayerRanking;
}

export interface PlayerRanking {
  odId: string;
  nickname: string;
  score: number;
  rank: number;
  perfectCount: number;
  winCount: number;
}
