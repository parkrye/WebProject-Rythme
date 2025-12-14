import { NOTE_FREQUENCIES } from '@rhythm-game/shared';

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

export const playNote = (note: string, duration: number = 0.3): void => {
  const frequency = NOTE_FREQUENCIES[note];
  if (!frequency) return;

  const ctx = getAudioContext();

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

export const resumeAudioContext = async (): Promise<void> => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
};

export interface NoteWithTimestamp {
  note: string;
  timestamp: number;
}

export const playMelody = (
  notes: NoteWithTimestamp[],
  onComplete?: () => void,
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
      playNote(noteData.note);
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
