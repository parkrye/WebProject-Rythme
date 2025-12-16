import type {
  MelodyFile,
  BGMMelodyFile,
  Note,
  InstrumentType,
} from '@rhythm-game/shared';
import {
  MELODY_FILE_VERSION,
  MELODY_FILE_EXTENSION,
  isMelodyFile,
  isBGMMelodyFile,
  DEFAULT_INSTRUMENT,
} from '@rhythm-game/shared';

/**
 * 멜로디 파일 생성
 */
export const createMelodyFile = (
  name: string,
  notes: Note[],
  instrument: InstrumentType = DEFAULT_INSTRUMENT,
  author: string = 'Unknown'
): MelodyFile => {
  const duration = notes.length > 0
    ? Math.max(...notes.map((n) => n.timestamp)) + 500
    : 0;

  return {
    version: MELODY_FILE_VERSION,
    type: 'melody',
    name,
    author,
    createdAt: Date.now(),
    duration,
    instrument,
    notes,
  };
};

/**
 * BGM용 멜로디 파일 생성
 */
export const createBGMMelodyFile = (
  name: string,
  notes: Note[],
  instrument: InstrumentType = DEFAULT_INSTRUMENT,
  author: string = 'Unknown'
): BGMMelodyFile => {
  const duration = notes.length > 0
    ? Math.max(...notes.map((n) => n.timestamp)) + 500
    : 0;

  return {
    version: MELODY_FILE_VERSION,
    type: 'bgm',
    name,
    author,
    createdAt: Date.now(),
    duration,
    instrument,
    notes,
    loopStart: 0,
    loopEnd: duration,
  };
};

/**
 * 멜로디 파일을 JSON 문자열로 변환
 */
export const serializeMelodyFile = (melody: MelodyFile | BGMMelodyFile): string => {
  return JSON.stringify(melody, null, 2);
};

/**
 * JSON 문자열에서 멜로디 파일 파싱
 */
export const parseMelodyFile = (content: string): MelodyFile | BGMMelodyFile | null => {
  try {
    const data = JSON.parse(content);
    if (isBGMMelodyFile(data)) {
      return data as BGMMelodyFile;
    }
    if (isMelodyFile(data)) {
      return data as MelodyFile;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * 멜로디 파일 다운로드 (브라우저)
 */
export const downloadMelodyFile = (melody: MelodyFile | BGMMelodyFile): void => {
  const content = serializeMelodyFile(melody);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${melody.name}${MELODY_FILE_EXTENSION}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 파일 선택 및 로드 (브라우저)
 */
export const loadMelodyFileFromInput = (): Promise<MelodyFile | BGMMelodyFile | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = MELODY_FILE_EXTENSION + ',.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const content = await file.text();
      const melody = parseMelodyFile(content);
      resolve(melody);
    };

    input.click();
  });
};

// IndexedDB 저장소 키
const MELODY_BGM_STORE_KEY = 'melodyBGM';

/**
 * IndexedDB에 BGM 멜로디 저장
 */
export const saveBGMMelodyToStorage = async (
  bgmType: string,
  melody: BGMMelodyFile
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RhythmGameDB', 1);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MELODY_BGM_STORE_KEY)) {
        db.createObjectStore(MELODY_BGM_STORE_KEY);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(MELODY_BGM_STORE_KEY, 'readwrite');
      const store = tx.objectStore(MELODY_BGM_STORE_KEY);
      store.put(melody, bgmType);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
};

/**
 * IndexedDB에서 BGM 멜로디 로드
 */
export const loadBGMMelodyFromStorage = async (
  bgmType: string
): Promise<BGMMelodyFile | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RhythmGameDB', 1);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MELODY_BGM_STORE_KEY)) {
        db.createObjectStore(MELODY_BGM_STORE_KEY);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(MELODY_BGM_STORE_KEY, 'readonly');
      const store = tx.objectStore(MELODY_BGM_STORE_KEY);
      const getRequest = store.get(bgmType);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data && isBGMMelodyFile(data)) {
          resolve(data);
        } else {
          resolve(null);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
};

/**
 * IndexedDB에서 BGM 멜로디 삭제
 */
export const deleteBGMMelodyFromStorage = async (
  bgmType: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RhythmGameDB', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(MELODY_BGM_STORE_KEY, 'readwrite');
      const store = tx.objectStore(MELODY_BGM_STORE_KEY);
      store.delete(bgmType);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
};
