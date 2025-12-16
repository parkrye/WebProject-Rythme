// BGM 설정 상수
export const BGM_CONFIG = {
  // IndexedDB 설정
  DB_NAME: 'rhythm-game-bgm',
  DB_VERSION: 1,
  STORE_NAME: 'bgm-files',

  // BGM 키
  LOBBY_BGM_KEY: 'lobby-bgm',
  GAME_BGM_KEY: 'game-bgm',
  RESULT_BGM_KEY: 'result-bgm',

  // 지원 파일 형식
  SUPPORTED_FORMATS: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],

  // 최대 파일 크기 (10MB)
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,

  // 기본 볼륨 (0.0 ~ 1.0)
  DEFAULT_VOLUME: 0.3,
} as const;

// BGM 종류
export const BGM_TYPES = {
  LOBBY: 'lobby',
  GAME: 'game',
  RESULT: 'result',
} as const;

// BGM 종류 라벨
export const BGM_LABELS: Record<BGMKey, string> = {
  [BGM_TYPES.LOBBY]: '로비 BGM',
  [BGM_TYPES.GAME]: '게임 BGM',
  [BGM_TYPES.RESULT]: '결과 BGM',
};

export type BGMKey = typeof BGM_TYPES[keyof typeof BGM_TYPES];
