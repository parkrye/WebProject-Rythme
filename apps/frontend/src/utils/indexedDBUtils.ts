import { BGM_CONFIG, type BGMKey } from '@rhythm-game/shared';

interface BGMRecord {
  key: BGMKey;
  file: Blob;
  fileName: string;
  mimeType: string;
  uploadedAt: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BGM_CONFIG.DB_NAME, BGM_CONFIG.DB_VERSION);

    request.onerror = () => {
      reject(new Error('IndexedDB를 열 수 없습니다.'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BGM_CONFIG.STORE_NAME)) {
        db.createObjectStore(BGM_CONFIG.STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

export const saveBGM = async (
  key: BGMKey,
  file: File,
): Promise<void> => {
  // 파일 형식 검증
  if (!(BGM_CONFIG.SUPPORTED_FORMATS as readonly string[]).includes(file.type)) {
    throw new Error('지원하지 않는 파일 형식입니다. (MP3, WAV, OGG만 지원)');
  }

  // 파일 크기 검증
  if (file.size > BGM_CONFIG.MAX_FILE_SIZE_BYTES) {
    throw new Error('파일 크기가 10MB를 초과합니다.');
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BGM_CONFIG.STORE_NAME, 'readwrite');
    const store = transaction.objectStore(BGM_CONFIG.STORE_NAME);

    const record: BGMRecord = {
      key,
      file: file,
      fileName: file.name,
      mimeType: file.type,
      uploadedAt: Date.now(),
    };

    const request = store.put(record);

    request.onerror = () => {
      reject(new Error('BGM 저장에 실패했습니다.'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
};

export const loadBGM = async (key: BGMKey): Promise<BGMRecord | null> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BGM_CONFIG.STORE_NAME, 'readonly');
    const store = transaction.objectStore(BGM_CONFIG.STORE_NAME);
    const request = store.get(key);

    request.onerror = () => {
      reject(new Error('BGM 로드에 실패했습니다.'));
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
};

export const deleteBGM = async (key: BGMKey): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BGM_CONFIG.STORE_NAME, 'readwrite');
    const store = transaction.objectStore(BGM_CONFIG.STORE_NAME);
    const request = store.delete(key);

    request.onerror = () => {
      reject(new Error('BGM 삭제에 실패했습니다.'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
};

export const getAllBGMs = async (): Promise<BGMRecord[]> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BGM_CONFIG.STORE_NAME, 'readonly');
    const store = transaction.objectStore(BGM_CONFIG.STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      reject(new Error('BGM 목록 로드에 실패했습니다.'));
    };

    request.onsuccess = () => {
      resolve(request.result || []);
    };
  });
};

export const createBGMObjectURL = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

export const revokeBGMObjectURL = (url: string): void => {
  URL.revokeObjectURL(url);
};
