// 악기 종류 (10종)
export const INSTRUMENTS = {
  PIANO: 'piano',
  ORGAN: 'organ',
  ELECTRIC_GUITAR: 'electric-guitar',
  BASS: 'bass',
  SYNTH_LEAD: 'synth-lead',
  SYNTH_PAD: 'synth-pad',
  VIBRAPHONE: 'vibraphone',
  CHIPTUNE: 'chiptune',
  FLUTE: 'flute',
  BRASS: 'brass',
} as const;

export type InstrumentType = typeof INSTRUMENTS[keyof typeof INSTRUMENTS];

// 악기 한글 라벨
export const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  [INSTRUMENTS.PIANO]: '피아노',
  [INSTRUMENTS.ORGAN]: '오르간',
  [INSTRUMENTS.ELECTRIC_GUITAR]: '일렉 기타',
  [INSTRUMENTS.BASS]: '베이스',
  [INSTRUMENTS.SYNTH_LEAD]: '신스 리드',
  [INSTRUMENTS.SYNTH_PAD]: '신스 패드',
  [INSTRUMENTS.VIBRAPHONE]: '비브라폰',
  [INSTRUMENTS.CHIPTUNE]: '칩튠',
  [INSTRUMENTS.FLUTE]: '플루트',
  [INSTRUMENTS.BRASS]: '브라스',
};

// 악기별 사운드 설정
export interface InstrumentConfig {
  oscillatorType: OscillatorType;
  attack: number;      // 어택 시간 (초)
  decay: number;       // 디케이 시간 (초)
  sustain: number;     // 서스테인 레벨 (0~1)
  release: number;     // 릴리즈 시간 (초)
  gainMultiplier: number; // 볼륨 배율
  detuneAmount?: number;  // 디튠 (비브라토용)
  octaveShift?: number;   // 옥타브 이동
  harmonics?: number[];   // 배음 추가
}

export const INSTRUMENT_CONFIGS: Record<InstrumentType, InstrumentConfig> = {
  // 피아노: 빠른 어택, 자연스러운 감쇠
  [INSTRUMENTS.PIANO]: {
    oscillatorType: 'sine',
    attack: 0.01,
    decay: 0.3,
    sustain: 0.4,
    release: 0.3,
    gainMultiplier: 0.5,
    harmonics: [1, 0.5, 0.25],
  },

  // 오르간: 지속음, 풍성한 배음
  [INSTRUMENTS.ORGAN]: {
    oscillatorType: 'sine',
    attack: 0.05,
    decay: 0.1,
    sustain: 0.8,
    release: 0.1,
    gainMultiplier: 0.4,
    harmonics: [1, 0.8, 0.6, 0.4],
  },

  // 일렉 기타: 톱니파, 중간 감쇠
  [INSTRUMENTS.ELECTRIC_GUITAR]: {
    oscillatorType: 'sawtooth',
    attack: 0.02,
    decay: 0.2,
    sustain: 0.5,
    release: 0.2,
    gainMultiplier: 0.35,
  },

  // 베이스: 낮은 옥타브, 둥근 음색
  [INSTRUMENTS.BASS]: {
    oscillatorType: 'sine',
    attack: 0.02,
    decay: 0.2,
    sustain: 0.6,
    release: 0.15,
    gainMultiplier: 0.6,
    octaveShift: -1,
  },

  // 신스 리드: 톱니파, 느린 어택
  [INSTRUMENTS.SYNTH_LEAD]: {
    oscillatorType: 'sawtooth',
    attack: 0.1,
    decay: 0.2,
    sustain: 0.7,
    release: 0.3,
    gainMultiplier: 0.4,
  },

  // 신스 패드: 삼각파, 아주 느린 어택/릴리즈
  [INSTRUMENTS.SYNTH_PAD]: {
    oscillatorType: 'triangle',
    attack: 0.4,
    decay: 0.3,
    sustain: 0.6,
    release: 0.5,
    gainMultiplier: 0.35,
  },

  // 비브라폰: 사인파 + 트레몰로
  [INSTRUMENTS.VIBRAPHONE]: {
    oscillatorType: 'sine',
    attack: 0.01,
    decay: 0.1,
    sustain: 0.5,
    release: 0.4,
    gainMultiplier: 0.45,
    detuneAmount: 15,
  },

  // 칩튠: 사각파, 짧은 감쇠
  [INSTRUMENTS.CHIPTUNE]: {
    oscillatorType: 'square',
    attack: 0.005,
    decay: 0.1,
    sustain: 0.3,
    release: 0.1,
    gainMultiplier: 0.3,
  },

  // 플루트: 부드러운 사인파
  [INSTRUMENTS.FLUTE]: {
    oscillatorType: 'sine',
    attack: 0.08,
    decay: 0.1,
    sustain: 0.7,
    release: 0.2,
    gainMultiplier: 0.4,
  },

  // 브라스: 톱니파, 밝은 음색
  [INSTRUMENTS.BRASS]: {
    oscillatorType: 'sawtooth',
    attack: 0.05,
    decay: 0.15,
    sustain: 0.6,
    release: 0.15,
    gainMultiplier: 0.4,
    harmonics: [1, 0.3],
  },
};

// 기본 악기
export const DEFAULT_INSTRUMENT: InstrumentType = INSTRUMENTS.PIANO;
