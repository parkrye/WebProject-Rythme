// 방 모드 종류
export const ROOM_MODES = {
  GAME: 'game',
  ENSEMBLE: 'ensemble',
} as const;

export type RoomMode = typeof ROOM_MODES[keyof typeof ROOM_MODES];

// 모드 한글 라벨
export const ROOM_MODE_LABELS: Record<RoomMode, string> = {
  [ROOM_MODES.GAME]: '게임 모드',
  [ROOM_MODES.ENSEMBLE]: '합주 모드',
};

// 모드 설명
export const ROOM_MODE_DESCRIPTIONS: Record<RoomMode, string> = {
  [ROOM_MODES.GAME]: '출제자의 멜로디를 따라하며 점수를 겨루세요',
  [ROOM_MODES.ENSEMBLE]: '모두 함께 자유롭게 연주하며 즐기세요',
};

// 모드 아이콘 (이모지)
export const ROOM_MODE_ICONS: Record<RoomMode, string> = {
  [ROOM_MODES.GAME]: '🎯',
  [ROOM_MODES.ENSEMBLE]: '🎵',
};

// 모드별 테마 색상 (Tailwind 클래스용)
export const ROOM_MODE_THEMES: Record<RoomMode, {
  primary: string;
  secondary: string;
  gradient: string;
  border: string;
  bg: string;
}> = {
  [ROOM_MODES.GAME]: {
    primary: 'text-primary',
    secondary: 'text-accent',
    gradient: 'from-primary to-accent',
    border: 'border-primary',
    bg: 'bg-primary/10',
  },
  [ROOM_MODES.ENSEMBLE]: {
    primary: 'text-secondary',
    secondary: 'text-success',
    gradient: 'from-secondary to-success',
    border: 'border-secondary',
    bg: 'bg-secondary/10',
  },
};

// 합주 모드 설정
export const ENSEMBLE_CONFIG = {
  // 모든 플레이어 동시 연주 가능
  SIMULTANEOUS_PLAY: true,
  // 녹음 기능 비활성화
  RECORDING_ENABLED: false,
  // 점수 시스템 비활성화
  SCORING_ENABLED: false,
  // 최대 동시 접속자
  MAX_PLAYERS: 6,
} as const;

// 기본 모드
export const DEFAULT_ROOM_MODE: RoomMode = ROOM_MODES.GAME;
