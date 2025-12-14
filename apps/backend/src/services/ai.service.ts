import { Injectable } from '@nestjs/common';
import type { Note, Player } from '@rhythm-game/shared';
import { PIANO_NOTES, WHITE_KEYS, AI_CONFIG } from '@rhythm-game/shared';

type AIDifficulty = 'easy' | 'normal' | 'hard';

@Injectable()
export class AIService {
  private aiCounter = 0;

  createAIPlayer(difficulty: AIDifficulty = 'easy'): Player {
    this.aiCounter++;
    return {
      odId: `ai_${Date.now()}_${this.aiCounter}`,
      nickname: `AI_${this.aiCounter}`,
      score: 0,
      isAI: true,
      isReady: true,
      joinedAt: Date.now(),
    };
  }

  generateMelody(): Note[] {
    const notes: Note[] = [];
    const noteCount = this.randomInt(4, 8);
    let timestamp = 0;

    const simplePatterns = [
      ['C4', 'D4', 'E4', 'F4'],
      ['C4', 'E4', 'G4', 'C5'],
      ['G4', 'E4', 'C4', 'E4'],
      ['C4', 'C4', 'G4', 'G4'],
      ['E4', 'D4', 'C4', 'D4', 'E4'],
    ];

    const pattern = simplePatterns[this.randomInt(0, simplePatterns.length - 1)];

    for (let i = 0; i < noteCount; i++) {
      const note = pattern[i % pattern.length];
      notes.push({
        note,
        timestamp,
      });
      timestamp += this.randomInt(300, 600);
    }

    return notes;
  }

  generateChallenge(original: Note[], targetSimilarity: number = 40): Note[] {
    if (original.length === 0) return [];

    const notes: Note[] = [];
    const errorRate = Math.max(0.3, 1 - targetSimilarity / 100);

    for (let i = 0; i < original.length; i++) {
      const originalNote = original[i];
      const shouldMakeError = Math.random() < errorRate;

      let note: string;
      if (shouldMakeError) {
        note = this.getAdjacentNote(originalNote.note);
      } else {
        note = originalNote.note;
      }

      const timingError = (Math.random() - 0.5) * 400;
      const timestamp = Math.max(0, originalNote.timestamp + timingError);

      notes.push({ note, timestamp });
    }

    if (Math.random() < 0.3) {
      const skipIndex = this.randomInt(0, notes.length - 1);
      notes.splice(skipIndex, 1);
    }

    if (Math.random() < 0.2) {
      const extraNote = {
        note: WHITE_KEYS[this.randomInt(0, WHITE_KEYS.length - 1)],
        timestamp: notes[notes.length - 1]?.timestamp + 300 || 0,
      };
      notes.push(extraNote);
    }

    return notes.sort((a, b) => a.timestamp - b.timestamp);
  }

  generateLosingChallenge(original: Note[]): Note[] {
    return this.generateChallenge(original, this.randomInt(30, 50));
  }

  private getAdjacentNote(note: string): string {
    const noteIndex = PIANO_NOTES.indexOf(note as typeof PIANO_NOTES[number]);
    if (noteIndex === -1) {
      return WHITE_KEYS[this.randomInt(0, WHITE_KEYS.length - 1)];
    }

    const offset = Math.random() < 0.5 ? -1 : 1;
    let newIndex = noteIndex + offset;

    if (newIndex < 0) newIndex = 1;
    if (newIndex >= PIANO_NOTES.length) newIndex = PIANO_NOTES.length - 2;

    return PIANO_NOTES[newIndex];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
