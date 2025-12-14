export const PIANO_NOTES = [
  'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4',
  'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'
] as const;

export const WHITE_KEYS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] as const;

export const BLACK_KEYS = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4'] as const;

export const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63,
  'C#4': 277.18,
  'D4': 293.66,
  'D#4': 311.13,
  'E4': 329.63,
  'F4': 349.23,
  'F#4': 369.99,
  'G4': 392.00,
  'G#4': 415.30,
  'A4': 440.00,
  'A#4': 466.16,
  'B4': 493.88,
  'C5': 523.25,
} as const;

export const NOTE_LABELS: Record<string, string> = {
  'C4': '도',
  'C#4': '도#',
  'D4': '레',
  'D#4': '레#',
  'E4': '미',
  'F4': '파',
  'F#4': '파#',
  'G4': '솔',
  'G#4': '솔#',
  'A4': '라',
  'A#4': '라#',
  'B4': '시',
  'C5': '도',
} as const;

export type PianoNote = typeof PIANO_NOTES[number];
