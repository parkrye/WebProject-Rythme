import { Injectable } from '@nestjs/common';
import {
  Note,
  ScoreGrade,
  SIMILARITY_WEIGHTS,
  SCORE_TABLE,
} from '@rhythm-game/shared';

@Injectable()
export class ScoreService {
  calculateSimilarity(original: Note[], challenge: Note[]): number {
    if (original.length === 0) return 0;
    if (challenge.length === 0) return 0;

    const noteSequenceScore = this.compareNoteSequence(original, challenge);
    const timingScore = this.compareTimings(original, challenge);
    const countScore = this.compareNoteCounts(original, challenge);

    const similarity =
      noteSequenceScore * SIMILARITY_WEIGHTS.NOTE_SEQUENCE +
      timingScore * SIMILARITY_WEIGHTS.TIMING +
      countScore * SIMILARITY_WEIGHTS.NOTE_COUNT;

    return Math.round(similarity * 100);
  }

  private compareNoteSequence(original: Note[], challenge: Note[]): number {
    const originalNotes = original.map((n) => n.note);
    const challengeNotes = challenge.map((n) => n.note);

    const lcs = this.longestCommonSubsequence(originalNotes, challengeNotes);
    return lcs / Math.max(originalNotes.length, challengeNotes.length);
  }

  private longestCommonSubsequence(a: string[], b: string[]): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  private compareTimings(original: Note[], challenge: Note[]): number {
    const minLength = Math.min(original.length, challenge.length);
    if (minLength === 0) return 0;

    let totalDiff = 0;
    const maxAllowedDiff = 500;

    for (let i = 0; i < minLength; i++) {
      const diff = Math.abs(original[i].timestamp - challenge[i].timestamp);
      const normalizedDiff = Math.min(diff, maxAllowedDiff) / maxAllowedDiff;
      totalDiff += 1 - normalizedDiff;
    }

    return totalDiff / minLength;
  }

  private compareNoteCounts(original: Note[], challenge: Note[]): number {
    const originalCount = original.length;
    const challengeCount = challenge.length;

    if (originalCount === 0 && challengeCount === 0) return 1;

    const diff = Math.abs(originalCount - challengeCount);
    const maxCount = Math.max(originalCount, challengeCount);

    return 1 - diff / maxCount;
  }

  getGrade(similarity: number): ScoreGrade {
    if (similarity >= SCORE_TABLE.PERFECT.threshold) return 'PERFECT';
    if (similarity >= SCORE_TABLE.GREAT.threshold) return 'GREAT';
    if (similarity >= SCORE_TABLE.GOOD.threshold) return 'GOOD';
    return 'MISS';
  }

  getScore(grade: ScoreGrade): number {
    return SCORE_TABLE[grade].score;
  }
}
