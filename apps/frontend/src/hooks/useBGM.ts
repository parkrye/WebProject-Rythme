import { useCallback, useEffect, useRef, useState } from 'react';
import { BGM_CONFIG, type BGMKey, type BGMMelodyFile } from '@rhythm-game/shared';
import {
  loadBGM,
  saveBGM,
  deleteBGM,
  createBGMObjectURL,
  revokeBGMObjectURL,
} from '../utils/indexedDBUtils';
import { createBGMGenerator } from '../utils/bgmGenerator';
import { playMelody } from '../utils/audioUtils';
import {
  loadBGMMelodyFromStorage,
  saveBGMMelodyToStorage,
  deleteBGMMelodyFromStorage,
} from '../utils/melodyFile';

type BGMSource = 'melody' | 'file' | 'generated';

interface UseBGMReturn {
  isPlaying: boolean;
  isLoading: boolean;
  hasCustomBGM: boolean;
  bgmSource: BGMSource;
  currentFileName: string | null;
  volume: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  uploadBGM: (file: File) => Promise<void>;
  uploadMelodyBGM: (melody: BGMMelodyFile) => Promise<void>;
  removeCustomBGM: () => Promise<void>;
}

export const useBGM = (bgmKey: BGMKey): UseBGMReturn => {
  // 커스텀 BGM용 (파일)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectURLRef = useRef<string | null>(null);

  // 기본 BGM용 (생성된 음악)
  const generatorRef = useRef<ReturnType<typeof createBGMGenerator> | null>(null);

  // 멜로디 BGM용
  const melodyRef = useRef<BGMMelodyFile | null>(null);
  const melodyStopRef = useRef<(() => void) | null>(null);
  const melodyLoopRef = useRef<boolean>(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCustomBGM, setHasCustomBGM] = useState(false);
  const [bgmSource, setBgmSource] = useState<BGMSource>('generated');
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [volume, setVolumeState] = useState<number>(BGM_CONFIG.DEFAULT_VOLUME);

  // 리소스 정리
  const cleanupResources = useCallback(() => {
    if (objectURLRef.current) {
      revokeBGMObjectURL(objectURLRef.current);
      objectURLRef.current = null;
    }
    if (generatorRef.current) {
      generatorRef.current.stop();
      generatorRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (melodyStopRef.current) {
      melodyStopRef.current();
      melodyStopRef.current = null;
    }
    melodyLoopRef.current = false;
    melodyRef.current = null;
  }, []);

  // 오디오 초기화
  const initAudio = useCallback(async () => {
    setIsLoading(true);
    cleanupResources();

    try {
      // 1. 멜로디 BGM 확인 (최우선)
      const melodyBGM = await loadBGMMelodyFromStorage(bgmKey);
      if (melodyBGM) {
        melodyRef.current = melodyBGM;
        setHasCustomBGM(true);
        setBgmSource('melody');
        setCurrentFileName(melodyBGM.name);
        setIsLoading(false);
        return;
      }

      // 2. 커스텀 파일 BGM 확인
      const customBGM = await loadBGM(bgmKey);
      if (customBGM) {
        const url = createBGMObjectURL(customBGM.file);
        objectURLRef.current = url;
        setHasCustomBGM(true);
        setBgmSource('file');
        setCurrentFileName(customBGM.fileName);

        audioRef.current = new Audio(url);
        audioRef.current.loop = true;
        audioRef.current.volume = volume;
        setIsLoading(false);
        return;
      }

      // 3. 기본 BGM 사용 (생성된 음악)
      setHasCustomBGM(false);
      setBgmSource('generated');
      setCurrentFileName(null);
      generatorRef.current = createBGMGenerator(bgmKey);
      generatorRef.current.setVolume(volume);
    } catch (error) {
      console.error('BGM 로드 실패:', error);
      setHasCustomBGM(false);
      setBgmSource('generated');
      setCurrentFileName(null);
      generatorRef.current = createBGMGenerator(bgmKey);
      generatorRef.current.setVolume(volume);
    } finally {
      setIsLoading(false);
    }
  }, [bgmKey, volume, cleanupResources]);

  // 초기화
  useEffect(() => {
    initAudio();
    return () => cleanupResources();
  }, [initAudio, cleanupResources]);

  // 멜로디 루프 재생
  const playMelodyLoop = useCallback(() => {
    if (!melodyRef.current) return;

    const playOnce = () => {
      if (!melodyLoopRef.current || !melodyRef.current) return;

      const stop = playMelody(
        melodyRef.current.notes,
        () => {
          // 재생 완료 후 루프
          if (melodyLoopRef.current) {
            setTimeout(playOnce, 100);
          }
        },
        melodyRef.current.instrument
      );
      melodyStopRef.current = stop;
    };

    melodyLoopRef.current = true;
    playOnce();
  }, []);

  // 재생
  const play = useCallback(() => {
    if (isLoading) return;

    if (bgmSource === 'melody' && melodyRef.current) {
      playMelodyLoop();
    } else if (bgmSource === 'file' && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('BGM 재생 실패:', error);
      });
    } else if (generatorRef.current) {
      generatorRef.current.start();
    }
    setIsPlaying(true);
  }, [isLoading, bgmSource, playMelodyLoop]);

  // 일시정지
  const pause = useCallback(() => {
    if (bgmSource === 'melody') {
      melodyLoopRef.current = false;
      if (melodyStopRef.current) {
        melodyStopRef.current();
        melodyStopRef.current = null;
      }
    } else if (bgmSource === 'file' && audioRef.current) {
      audioRef.current.pause();
    } else if (generatorRef.current) {
      generatorRef.current.stop();
    }
    setIsPlaying(false);
  }, [bgmSource]);

  // 정지 (처음으로)
  const stop = useCallback(() => {
    if (bgmSource === 'melody') {
      melodyLoopRef.current = false;
      if (melodyStopRef.current) {
        melodyStopRef.current();
        melodyStopRef.current = null;
      }
    } else if (bgmSource === 'file' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } else if (generatorRef.current) {
      generatorRef.current.stop();
    }
    setIsPlaying(false);
  }, [bgmSource]);

  // 볼륨 설정
  const setVolume = useCallback(
    (newVolume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      setVolumeState(clampedVolume);

      // 멜로디 BGM은 현재 볼륨 조절 미지원 (추후 구현 가능)
      if (bgmSource === 'file' && audioRef.current) {
        audioRef.current.volume = clampedVolume;
      } else if (generatorRef.current) {
        generatorRef.current.setVolume(clampedVolume);
      }
    },
    [bgmSource],
  );

  // 커스텀 BGM 업로드 (파일)
  const uploadBGM = useCallback(
    async (file: File) => {
      const wasPlaying = isPlaying;
      if (wasPlaying) {
        pause();
      }

      // 멜로디 BGM 삭제 (파일이 우선)
      await deleteBGMMelodyFromStorage(bgmKey);
      await saveBGM(bgmKey, file);
      await initAudio();

      if (wasPlaying) {
        setTimeout(() => play(), 100);
      }
    },
    [bgmKey, initAudio, isPlaying, pause, play],
  );

  // 멜로디 BGM 업로드
  const uploadMelodyBGM = useCallback(
    async (melody: BGMMelodyFile) => {
      const wasPlaying = isPlaying;
      if (wasPlaying) {
        pause();
      }

      // 파일 BGM 삭제 (멜로디가 우선)
      await deleteBGM(bgmKey);
      await saveBGMMelodyToStorage(bgmKey, melody);
      await initAudio();

      if (wasPlaying) {
        setTimeout(() => play(), 100);
      }
    },
    [bgmKey, initAudio, isPlaying, pause, play],
  );

  // 커스텀 BGM 삭제 (모두 삭제)
  const removeCustomBGM = useCallback(async () => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      pause();
    }

    await deleteBGM(bgmKey);
    await deleteBGMMelodyFromStorage(bgmKey);
    await initAudio();

    if (wasPlaying) {
      setTimeout(() => play(), 100);
    }
  }, [bgmKey, initAudio, isPlaying, pause, play]);

  return {
    isPlaying,
    isLoading,
    hasCustomBGM,
    bgmSource,
    currentFileName,
    volume,
    play,
    pause,
    stop,
    setVolume,
    uploadBGM,
    uploadMelodyBGM,
    removeCustomBGM,
  };
};
