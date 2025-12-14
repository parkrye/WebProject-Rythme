import type { Note } from '@rhythm-game/shared';

export class SubmitRecordingDto {
  roomId: string;
  notes: Note[];
}
