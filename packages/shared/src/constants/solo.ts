// 개인방(솔로 모드) 상수
export const SOLO_CONFIG = {
  // 모드 종류
  MODES: {
    FREE_PLAY: 'free-play',
    CHALLENGE_AI: 'challenge-ai',
    CREATE_QUIZ: 'create-quiz',
  },

  // AI 난이도별 멜로디 패턴
  AI_MELODY_PATTERNS: {
    easy: {
      noteCount: { min: 4, max: 6 },
      tempoMs: { min: 400, max: 600 },
    },
    normal: {
      noteCount: { min: 6, max: 10 },
      tempoMs: { min: 300, max: 500 },
    },
    hard: {
      noteCount: { min: 8, max: 14 },
      tempoMs: { min: 200, max: 400 },
    },
  },

  // 도전 제한 시간 (ms)
  CHALLENGE_TIME_MS: 15000,

  // 결과 표시 시간 (ms)
  RESULT_DISPLAY_TIME_MS: 5000,
} as const;

export const SOLO_MODE_LABELS = {
  [SOLO_CONFIG.MODES.FREE_PLAY]: '자유 연습',
  [SOLO_CONFIG.MODES.CHALLENGE_AI]: 'AI 도전',
  [SOLO_CONFIG.MODES.CREATE_QUIZ]: '문제 출제',
} as const;

export const SOLO_MODE_DESCRIPTIONS = {
  [SOLO_CONFIG.MODES.FREE_PLAY]: '자유롭게 피아노를 연주해보세요',
  [SOLO_CONFIG.MODES.CHALLENGE_AI]: 'AI가 출제한 멜로디를 따라해보세요',
  [SOLO_CONFIG.MODES.CREATE_QUIZ]: '멜로디를 녹음하면 AI가 도전합니다',
} as const;

export type SoloMode = typeof SOLO_CONFIG.MODES[keyof typeof SOLO_CONFIG.MODES];
// AIDifficulty는 game.ts에서 export됨
