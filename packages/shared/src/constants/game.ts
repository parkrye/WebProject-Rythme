export const GAME_CONFIG = {
  MAX_PLAYERS: 6,
  MIN_PLAYERS: 1,
  RECORDING_TIME_MS: 10000,
  LISTENING_TIME_MS: 5000,
  CHALLENGE_TIME_MS: 15000,
  IDLE_TIME_MS: 3000,
  JUDGING_TIME_MS: 2000,
  RESULT_TIME_MS: 8000,
  RECONNECT_TIMEOUT_MS: 10000,
  MAX_CONSECUTIVE_MISS: 3,
  TOTAL_ROUNDS: 3,
} as const;

export const SCORE_TABLE = {
  PERFECT: { threshold: 90, score: 100 },
  GREAT: { threshold: 70, score: 70 },
  GOOD: { threshold: 50, score: 50 },
  MISS: { threshold: 0, score: 30 },
  NO_CHALLENGER: { score: 20 },
} as const;

export const BONUS_SCORE = {
  ALL_PERFECT: 50,
  ONLY_WINNER: 30,
} as const;

// 총 턴 수 = 플레이어 수 * TOTAL_ROUNDS (각 플레이어가 라운드당 1번씩 출제)
export const calculateTotalTurns = (playerCount: number): number => {
  return playerCount * GAME_CONFIG.TOTAL_ROUNDS;
};

export const SIMILARITY_WEIGHTS = {
  NOTE_SEQUENCE: 0.5,
  TIMING: 0.3,
  NOTE_COUNT: 0.2,
} as const;

export const AI_CONFIG = {
  easy: {
    targetSimilarity: { min: 40, max: 60 },
    mistakeRate: 0.4,
    timingVariance: 200,
  },
  normal: {
    targetSimilarity: { min: 60, max: 80 },
    mistakeRate: 0.2,
    timingVariance: 100,
  },
  hard: {
    targetSimilarity: { min: 80, max: 95 },
    mistakeRate: 0.05,
    timingVariance: 50,
  },
} as const;

export type AIDifficulty = keyof typeof AI_CONFIG;
