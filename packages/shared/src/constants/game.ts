export const GAME_CONFIG = {
  MAX_PLAYERS: 6,
  MIN_PLAYERS: 1,
  // 출제자 페이즈 총 시간 (20초)
  RECORDING_TIME_MS: 20000,
  // 최대 녹화 시간 (10초)
  MAX_RECORDING_DURATION_MS: 10000,
  LISTENING_TIME_MS: 5000,
  // 도전자 페이즈 총 시간 (20초)
  CHALLENGE_TIME_MS: 20000,
  // 최대 도전 녹음 시간 (10초)
  MAX_CHALLENGE_DURATION_MS: 10000,
  IDLE_TIME_MS: 3000,
  JUDGING_TIME_MS: 2000,
  // 결과 발표 시간 (20초, 모든 플레이어 스킵 시 즉시 종료)
  RESULT_TIME_MS: 20000,
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

// 일치율 세부 요소 (총 100%)
export const SIMILARITY_WEIGHTS = {
  // 음 정확도: 올바른 음을 눌렀는지 (25%)
  NOTE_ACCURACY: 0.25,
  // 음 순서: 연주한 음의 순서가 일치하는지 (20%)
  NOTE_SEQUENCE: 0.2,
  // 타이밍 정확도: 각 음의 연주 시점이 일치하는지 (20%)
  TIMING_ACCURACY: 0.2,
  // 악기 일치도: 같은 악기를 사용했는지 (15%)
  INSTRUMENT_MATCH: 0.15,
  // 템포 유지: 전체적인 연주 속도가 일정한지 (10%)
  TEMPO_CONSISTENCY: 0.1,
  // 음 개수: 연주한 음의 총 개수가 일치하는지 (10%)
  NOTE_COUNT: 0.1,
} as const;

// 일치율 요소 한글 라벨 (UI 표시용)
export const SIMILARITY_LABELS = {
  NOTE_ACCURACY: '음 정확도',
  NOTE_SEQUENCE: '음 순서',
  TIMING_ACCURACY: '타이밍',
  INSTRUMENT_MATCH: '악기',
  TEMPO_CONSISTENCY: '템포 유지',
  NOTE_COUNT: '음 개수',
} as const;

export type SimilarityFactor = keyof typeof SIMILARITY_WEIGHTS;

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
