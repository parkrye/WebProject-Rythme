import { useEffect, useRef } from 'react';

declare const __BUILD_VERSION__: string;

const VERSION_CHECK_INTERVAL = 60000; // 60초마다 체크 (프로덕션)
const IS_DEVELOPMENT = import.meta.env.DEV;

interface VersionInfo {
  version: string;
  buildTime: string;
}

const clearCacheAndReload = async () => {
  // 서비스 워커 캐시 삭제
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }

  // 서비스 워커 등록 해제
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((reg) => reg.unregister()));
  }

  // 하드 리로드
  window.location.reload();
};

export const useVersionCheck = () => {
  const currentVersion = useRef<string>(__BUILD_VERSION__);

  useEffect(() => {
    // 개발 모드에서는 버전 체크 비활성화
    if (IS_DEVELOPMENT) {
      console.debug('개발 모드: 버전 체크 비활성화');
      return;
    }

    const checkVersion = async () => {
      try {
        // 캐시 무시하고 최신 version.json 가져오기
        const response = await fetch('/version.json', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) return;

        const data: VersionInfo = await response.json();

        // 버전이 다르면 캐시 삭제 후 새로고침
        if (data.version !== currentVersion.current) {
          console.log(`새 버전 감지: ${currentVersion.current} → ${data.version}`);
          console.log(`빌드 시간: ${data.buildTime}`);
          await clearCacheAndReload();
        }
      } catch (error) {
        // version.json을 가져올 수 없는 경우 무시
        console.debug('버전 체크 실패:', error);
      }
    };

    // 초기 체크 (5초 후)
    const initialTimeout = setTimeout(checkVersion, 5000);

    // 주기적 체크
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    // 페이지 포커스 시 체크
    const handleFocus = () => {
      checkVersion();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
};
