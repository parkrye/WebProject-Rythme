import type { Note } from './game.js';
import type { InstrumentType } from '../constants/instrument.js';

/**
 * 멜로디 파일 타입
 */
export type MelodyFileType = 'melody' | 'bgm';

/**
 * 기본 멜로디 파일 포맷 (.rthm)
 * 이 프로젝트에서만 사용되는 텍스트 기반 멜로디 에셋
 */
export interface BaseMelodyFile {
  // 파일 메타데이터
  version: string;
  type: MelodyFileType;

  // 멜로디 정보
  name: string;
  author: string;
  createdAt: number;
  duration: number; // ms

  // 연주 데이터
  instrument: InstrumentType;
  bpm?: number; // 선택적 BPM 정보
  notes: Note[];
}

/**
 * 일반 멜로디 파일
 */
export interface MelodyFile extends BaseMelodyFile {
  type: 'melody';
}

/**
 * BGM용 멜로디 파일 (루프 가능)
 */
export interface BGMMelodyFile extends BaseMelodyFile {
  type: 'bgm';
  loopStart?: number; // 루프 시작 지점 (ms)
  loopEnd?: number; // 루프 종료 지점 (ms, 없으면 duration)
}

/**
 * 멜로디 파일 타입 가드
 */
export const isMelodyFile = (data: unknown): data is BaseMelodyFile => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    obj.version === '1.0' &&
    (obj.type === 'melody' || obj.type === 'bgm') &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.notes)
  );
};

export const isBGMMelodyFile = (data: unknown): data is BGMMelodyFile => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return isMelodyFile(data) && obj.type === 'bgm';
};

/**
 * 파일 확장자
 */
export const MELODY_FILE_EXTENSION = '.rthm';
export const MELODY_FILE_VERSION = '1.0';
