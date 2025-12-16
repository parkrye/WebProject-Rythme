import { type BGMKey, BGM_TYPES, BGM_CONFIG } from '@rhythm-game/shared';

// 음계 주파수 (Hz)
const FREQUENCIES: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
};

// BGM 길이 (16초)
const BGM_DURATION = 16;

interface BGMGenerator {
  start: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
}

// 오실레이터 타입
type OscType = 'sine' | 'square' | 'sawtooth' | 'triangle';

// 공통 유틸: 노트 스케줄링
const scheduleNote = (
  ctx: AudioContext,
  destination: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  type: OscType = 'sine',
  maxGain: number = 0.1,
): OscillatorNode => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(destination);

  // ADSR 엔벨로프
  const attack = 0.05;
  const decay = 0.1;
  const sustain = maxGain * 0.7;
  const release = 0.2;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(maxGain, startTime + attack);
  gain.gain.linearRampToValueAtTime(sustain, startTime + attack + decay);
  gain.gain.setValueAtTime(sustain, startTime + duration - release);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);

  return osc;
};

// 코드 (화음) 스케줄링
const scheduleChord = (
  ctx: AudioContext,
  destination: AudioNode,
  notes: string[],
  startTime: number,
  duration: number,
  type: OscType = 'sine',
  maxGain: number = 0.08,
): OscillatorNode[] => {
  return notes.map((note) =>
    scheduleNote(ctx, destination, FREQUENCIES[note], startTime, duration, type, maxGain / notes.length),
  );
};

// ============================================
// 로비 BGM: 몽환적인 앰비언트 + 아르페지오
// ============================================
const createLobbyBGM = (ctx: AudioContext, masterGain: GainNode): (() => void) => {
  const oscillators: OscillatorNode[] = [];
  const now = ctx.currentTime;

  // 코드 진행: Am - F - C - G (16초, 각 4초)
  const chordProgression = [
    { notes: ['A3', 'C4', 'E4'], start: 0 },
    { notes: ['F3', 'A3', 'C4'], start: 4 },
    { notes: ['C3', 'E3', 'G3'], start: 8 },
    { notes: ['G3', 'B3', 'D4'], start: 12 },
  ];

  // 패드 (긴 화음)
  chordProgression.forEach(({ notes, start }) => {
    const oscs = scheduleChord(ctx, masterGain, notes, now + start, 4, 'sine', 0.15);
    oscillators.push(...oscs);
  });

  // 아르페지오 패턴
  const arpeggioPattern = [
    // Am 아르페지오
    { note: 'A4', time: 0 }, { note: 'C5', time: 0.5 }, { note: 'E5', time: 1 }, { note: 'C5', time: 1.5 },
    { note: 'A4', time: 2 }, { note: 'C5', time: 2.5 }, { note: 'E5', time: 3 }, { note: 'A5', time: 3.5 },
    // F 아르페지오
    { note: 'F4', time: 4 }, { note: 'A4', time: 4.5 }, { note: 'C5', time: 5 }, { note: 'A4', time: 5.5 },
    { note: 'F4', time: 6 }, { note: 'A4', time: 6.5 }, { note: 'C5', time: 7 }, { note: 'F5', time: 7.5 },
    // C 아르페지오
    { note: 'C4', time: 8 }, { note: 'E4', time: 8.5 }, { note: 'G4', time: 9 }, { note: 'E4', time: 9.5 },
    { note: 'C4', time: 10 }, { note: 'E4', time: 10.5 }, { note: 'G4', time: 11 }, { note: 'C5', time: 11.5 },
    // G 아르페지오
    { note: 'G4', time: 12 }, { note: 'B4', time: 12.5 }, { note: 'D5', time: 13 }, { note: 'B4', time: 13.5 },
    { note: 'G4', time: 14 }, { note: 'B4', time: 14.5 }, { note: 'D5', time: 15 }, { note: 'G5', time: 15.5 },
  ];

  arpeggioPattern.forEach(({ note, time }) => {
    const osc = scheduleNote(ctx, masterGain, FREQUENCIES[note], now + time, 0.4, 'triangle', 0.12);
    oscillators.push(osc);
  });

  return () => {
    oscillators.forEach((osc) => {
      try { osc.stop(); } catch { /* 이미 정지됨 */ }
    });
  };
};

// ============================================
// 게임 BGM: 긴장감 있는 신스웨이브
// ============================================
const createGameBGM = (ctx: AudioContext, masterGain: GainNode): (() => void) => {
  const oscillators: OscillatorNode[] = [];
  const now = ctx.currentTime;

  // 코드 진행: Em - C - G - D (16초)
  const chordProgression = [
    { notes: ['E3', 'G3', 'B3'], start: 0 },
    { notes: ['C3', 'E3', 'G3'], start: 4 },
    { notes: ['G3', 'B3', 'D4'], start: 8 },
    { notes: ['D3', 'F3', 'A3'], start: 12 },
  ];

  // 베이스 패드
  chordProgression.forEach(({ notes, start }) => {
    const oscs = scheduleChord(ctx, masterGain, notes, now + start, 4, 'sawtooth', 0.1);
    oscillators.push(...oscs);
  });

  // 베이스 라인 (옥타브 낮은 루트)
  const bassPattern = [
    { note: 'E3', time: 0 }, { note: 'E3', time: 1 }, { note: 'E3', time: 2 }, { note: 'E3', time: 3 },
    { note: 'C3', time: 4 }, { note: 'C3', time: 5 }, { note: 'C3', time: 6 }, { note: 'C3', time: 7 },
    { note: 'G3', time: 8 }, { note: 'G3', time: 9 }, { note: 'G3', time: 10 }, { note: 'G3', time: 11 },
    { note: 'D3', time: 12 }, { note: 'D3', time: 13 }, { note: 'D3', time: 14 }, { note: 'D3', time: 15 },
  ];

  bassPattern.forEach(({ note, time }) => {
    const osc = scheduleNote(ctx, masterGain, FREQUENCIES[note] / 2, now + time, 0.8, 'square', 0.15);
    oscillators.push(osc);
  });

  // 빠른 아르페지오 (긴장감)
  const fastArpeggio = [
    // Em
    { note: 'E4', time: 0 }, { note: 'G4', time: 0.25 }, { note: 'B4', time: 0.5 }, { note: 'E5', time: 0.75 },
    { note: 'B4', time: 1 }, { note: 'G4', time: 1.25 }, { note: 'E4', time: 1.5 }, { note: 'G4', time: 1.75 },
    { note: 'E4', time: 2 }, { note: 'G4', time: 2.25 }, { note: 'B4', time: 2.5 }, { note: 'E5', time: 2.75 },
    { note: 'B4', time: 3 }, { note: 'G4', time: 3.25 }, { note: 'E4', time: 3.5 }, { note: 'G4', time: 3.75 },
    // C
    { note: 'C4', time: 4 }, { note: 'E4', time: 4.25 }, { note: 'G4', time: 4.5 }, { note: 'C5', time: 4.75 },
    { note: 'G4', time: 5 }, { note: 'E4', time: 5.25 }, { note: 'C4', time: 5.5 }, { note: 'E4', time: 5.75 },
    { note: 'C4', time: 6 }, { note: 'E4', time: 6.25 }, { note: 'G4', time: 6.5 }, { note: 'C5', time: 6.75 },
    { note: 'G4', time: 7 }, { note: 'E4', time: 7.25 }, { note: 'C4', time: 7.5 }, { note: 'E4', time: 7.75 },
    // G
    { note: 'G4', time: 8 }, { note: 'B4', time: 8.25 }, { note: 'D5', time: 8.5 }, { note: 'G5', time: 8.75 },
    { note: 'D5', time: 9 }, { note: 'B4', time: 9.25 }, { note: 'G4', time: 9.5 }, { note: 'B4', time: 9.75 },
    { note: 'G4', time: 10 }, { note: 'B4', time: 10.25 }, { note: 'D5', time: 10.5 }, { note: 'G5', time: 10.75 },
    { note: 'D5', time: 11 }, { note: 'B4', time: 11.25 }, { note: 'G4', time: 11.5 }, { note: 'B4', time: 11.75 },
    // D
    { note: 'D4', time: 12 }, { note: 'F4', time: 12.25 }, { note: 'A4', time: 12.5 }, { note: 'D5', time: 12.75 },
    { note: 'A4', time: 13 }, { note: 'F4', time: 13.25 }, { note: 'D4', time: 13.5 }, { note: 'F4', time: 13.75 },
    { note: 'D4', time: 14 }, { note: 'F4', time: 14.25 }, { note: 'A4', time: 14.5 }, { note: 'D5', time: 14.75 },
    { note: 'A4', time: 15 }, { note: 'F4', time: 15.25 }, { note: 'D4', time: 15.5 }, { note: 'F4', time: 15.75 },
  ];

  fastArpeggio.forEach(({ note, time }) => {
    const osc = scheduleNote(ctx, masterGain, FREQUENCIES[note], now + time, 0.2, 'triangle', 0.1);
    oscillators.push(osc);
  });

  return () => {
    oscillators.forEach((osc) => {
      try { osc.stop(); } catch { /* 이미 정지됨 */ }
    });
  };
};

// ============================================
// 결과 BGM: 밝고 승리감 있는 멜로디
// ============================================
const createResultBGM = (ctx: AudioContext, masterGain: GainNode): (() => void) => {
  const oscillators: OscillatorNode[] = [];
  const now = ctx.currentTime;

  // 코드 진행: C - G - Am - F (밝은 느낌)
  const chordProgression = [
    { notes: ['C4', 'E4', 'G4'], start: 0 },
    { notes: ['G3', 'B3', 'D4'], start: 4 },
    { notes: ['A3', 'C4', 'E4'], start: 8 },
    { notes: ['F3', 'A3', 'C4'], start: 12 },
  ];

  // 밝은 패드
  chordProgression.forEach(({ notes, start }) => {
    const oscs = scheduleChord(ctx, masterGain, notes, now + start, 4, 'sine', 0.12);
    oscillators.push(...oscs);
  });

  // 상승하는 멜로디 (승리감)
  const melodyPattern = [
    // C 메이저
    { note: 'C5', time: 0 }, { note: 'E5', time: 0.5 }, { note: 'G5', time: 1 },
    { note: 'E5', time: 1.5 }, { note: 'C5', time: 2 }, { note: 'G4', time: 2.5 },
    { note: 'C5', time: 3 }, { note: 'E5', time: 3.5 },
    // G 메이저
    { note: 'G5', time: 4 }, { note: 'B5', time: 4.5 }, { note: 'D5', time: 5 },
    { note: 'B4', time: 5.5 }, { note: 'G4', time: 6 }, { note: 'D5', time: 6.5 },
    { note: 'G5', time: 7 }, { note: 'B5', time: 7.5 },
    // Am
    { note: 'A5', time: 8 }, { note: 'C5', time: 8.5 }, { note: 'E5', time: 9 },
    { note: 'C5', time: 9.5 }, { note: 'A4', time: 10 }, { note: 'E5', time: 10.5 },
    { note: 'A5', time: 11 }, { note: 'C5', time: 11.5 },
    // F 메이저
    { note: 'F5', time: 12 }, { note: 'A5', time: 12.5 }, { note: 'C5', time: 13 },
    { note: 'A4', time: 13.5 }, { note: 'F4', time: 14 }, { note: 'C5', time: 14.5 },
    { note: 'F5', time: 15 }, { note: 'A5', time: 15.5 },
  ];

  melodyPattern.forEach(({ note, time }) => {
    const osc = scheduleNote(ctx, masterGain, FREQUENCIES[note], now + time, 0.4, 'triangle', 0.15);
    oscillators.push(osc);
  });

  // 하모니 레이어 (3도 위)
  const harmonyPattern = [
    { note: 'E5', time: 0 }, { note: 'G5', time: 1 }, { note: 'E5', time: 2 }, { note: 'G5', time: 3 },
    { note: 'B5', time: 4 }, { note: 'D5', time: 5 }, { note: 'B4', time: 6 }, { note: 'D5', time: 7 },
    { note: 'C5', time: 8 }, { note: 'E5', time: 9 }, { note: 'C5', time: 10 }, { note: 'E5', time: 11 },
    { note: 'A5', time: 12 }, { note: 'C5', time: 13 }, { note: 'A4', time: 14 }, { note: 'C5', time: 15 },
  ];

  harmonyPattern.forEach(({ note, time }) => {
    const osc = scheduleNote(ctx, masterGain, FREQUENCIES[note], now + time, 0.8, 'sine', 0.08);
    oscillators.push(osc);
  });

  return () => {
    oscillators.forEach((osc) => {
      try { osc.stop(); } catch { /* 이미 정지됨 */ }
    });
  };
};

// ============================================
// BGM 생성기 팩토리
// ============================================
export const createBGMGenerator = (bgmKey: BGMKey): BGMGenerator => {
  let audioContext: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let stopCurrentLoop: (() => void) | null = null;
  let loopInterval: number | null = null;
  let isPlaying = false;

  const getBGMCreator = () => {
    switch (bgmKey) {
      case BGM_TYPES.LOBBY:
        return createLobbyBGM;
      case BGM_TYPES.GAME:
        return createGameBGM;
      case BGM_TYPES.RESULT:
        return createResultBGM;
      default:
        return createLobbyBGM;
    }
  };

  const startLoop = () => {
    if (!audioContext || !masterGain) return;

    const creator = getBGMCreator();
    stopCurrentLoop = creator(audioContext, masterGain);

    // 16초 후 다시 시작 (반복)
    loopInterval = window.setTimeout(() => {
      if (isPlaying) {
        stopCurrentLoop?.();
        startLoop();
      }
    }, BGM_DURATION * 1000);
  };

  const start = () => {
    if (isPlaying) return;

    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = BGM_CONFIG.DEFAULT_VOLUME;
    masterGain.connect(audioContext.destination);

    isPlaying = true;
    startLoop();
  };

  const stop = () => {
    isPlaying = false;

    if (loopInterval) {
      clearTimeout(loopInterval);
      loopInterval = null;
    }

    stopCurrentLoop?.();
    stopCurrentLoop = null;

    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }

    masterGain = null;
  };

  const setVolume = (volume: number) => {
    if (masterGain) {
      masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  };

  return { start, stop, setVolume };
};
