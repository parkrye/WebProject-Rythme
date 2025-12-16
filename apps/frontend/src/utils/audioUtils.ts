import {
  NOTE_FREQUENCIES,
  INSTRUMENT_CONFIGS,
  DEFAULT_INSTRUMENT,
  type InstrumentType,
} from '@rhythm-game/shared';

let audioContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

export const resumeAudioContext = async (): Promise<void> => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
};

// 악기별 음 재생
export const playNote = (
  note: string,
  duration: number = 0.5,
  instrument: InstrumentType = DEFAULT_INSTRUMENT
): void => {
  const frequency = NOTE_FREQUENCIES[note];
  if (!frequency) return;

  const ctx = getAudioContext();
  const config = INSTRUMENT_CONFIGS[instrument];
  const now = ctx.currentTime;

  // 옥타브 시프트 적용
  const adjustedFreq = config.octaveShift
    ? frequency * Math.pow(2, config.octaveShift)
    : frequency;

  // 메인 오실레이터
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = config.oscillatorType;
  oscillator.frequency.value = adjustedFreq;

  // 디튠 (비브라토 효과)
  if (config.detuneAmount) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 5; // 5Hz 비브라토
    lfoGain.gain.value = config.detuneAmount;
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.detune);
    lfo.start(now);
    lfo.stop(now + duration + config.release);
  }

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // ADSR 엔벨로프
  const maxGain = config.gainMultiplier;
  const sustainLevel = maxGain * config.sustain;

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(maxGain, now + config.attack);
  gainNode.gain.linearRampToValueAtTime(sustainLevel, now + config.attack + config.decay);
  gainNode.gain.setValueAtTime(sustainLevel, now + duration);
  gainNode.gain.linearRampToValueAtTime(0.001, now + duration + config.release);

  oscillator.start(now);
  oscillator.stop(now + duration + config.release);

  // 배음 추가 (하모닉스)
  if (config.harmonics && config.harmonics.length > 1) {
    config.harmonics.slice(1).forEach((harmonic, index) => {
      const harmonicOsc = ctx.createOscillator();
      const harmonicGain = ctx.createGain();

      harmonicOsc.type = config.oscillatorType;
      harmonicOsc.frequency.value = adjustedFreq * (index + 2); // 2배, 3배, 4배...

      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(ctx.destination);

      const harmonicMaxGain = maxGain * harmonic;
      const harmonicSustain = harmonicMaxGain * config.sustain;

      harmonicGain.gain.setValueAtTime(0, now);
      harmonicGain.gain.linearRampToValueAtTime(harmonicMaxGain, now + config.attack);
      harmonicGain.gain.linearRampToValueAtTime(harmonicSustain, now + config.attack + config.decay);
      harmonicGain.gain.setValueAtTime(harmonicSustain, now + duration);
      harmonicGain.gain.linearRampToValueAtTime(0.001, now + duration + config.release);

      harmonicOsc.start(now);
      harmonicOsc.stop(now + duration + config.release);
    });
  }
};

// 녹음 데이터 타입 (악기 정보 포함)
export interface NoteWithTimestamp {
  note: string;
  timestamp: number;
  instrument?: InstrumentType;
}

// 멜로디 재생
export const playMelody = (
  notes: NoteWithTimestamp[],
  onComplete?: () => void,
  defaultInstrument: InstrumentType = DEFAULT_INSTRUMENT
): (() => void) => {
  if (notes.length === 0) {
    onComplete?.();
    return () => {};
  }

  const sortedNotes = [...notes].sort((a, b) => a.timestamp - b.timestamp);
  const startTime = sortedNotes[0].timestamp;
  const timeouts: number[] = [];

  sortedNotes.forEach((noteData) => {
    const delay = noteData.timestamp - startTime;
    const timeout = window.setTimeout(() => {
      playNote(noteData.note, 0.5, noteData.instrument || defaultInstrument);
    }, delay);
    timeouts.push(timeout);
  });

  const lastNote = sortedNotes[sortedNotes.length - 1];
  const totalDuration = lastNote.timestamp - startTime + 500;

  const completeTimeout = window.setTimeout(() => {
    onComplete?.();
  }, totalDuration);
  timeouts.push(completeTimeout);

  return () => {
    timeouts.forEach((t) => window.clearTimeout(t));
  };
};
