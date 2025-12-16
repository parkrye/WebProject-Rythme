import React, { useRef, useState } from 'react';
import { BGM_CONFIG, BGM_LABELS, type BGMKey } from '@rhythm-game/shared';
import { useBGM } from '../../hooks/useBGM';

interface BGMUploaderProps {
  bgmKey: BGMKey;
}

const BGMUploader: React.FC<BGMUploaderProps> = ({ bgmKey }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    isPlaying,
    isLoading,
    hasCustomBGM,
    currentFileName,
    volume,
    play,
    pause,
    setVolume,
    uploadBGM,
    removeCustomBGM,
  } = useBGM(bgmKey);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      await uploadBGM(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 실패');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    setError(null);
    try {
      await removeCustomBGM();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const label = BGM_LABELS[bgmKey];

  return (
    <div className="bgm-uploader">
      <div className="bgm-uploader__header">
        <span className="bgm-uploader__label">{label}</span>
        <span className="bgm-uploader__status">
          {hasCustomBGM ? currentFileName : '기본 BGM'}
        </span>
      </div>

      <div className="bgm-uploader__controls">
        {/* 재생/일시정지 */}
        <button
          type="button"
          onClick={isPlaying ? pause : play}
          disabled={isLoading}
          className="bgm-uploader__btn bgm-uploader__btn--play"
        >
          {isPlaying ? '||' : '▶'}
        </button>

        {/* 볼륨 슬라이더 */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="bgm-uploader__volume"
        />

        {/* 업로드 버튼 */}
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={isUploading}
          className="bgm-uploader__btn bgm-uploader__btn--upload"
        >
          {isUploading ? '...' : '업로드'}
        </button>

        {/* 삭제 버튼 (커스텀 BGM이 있을 때만) */}
        {hasCustomBGM && (
          <button
            type="button"
            onClick={handleRemove}
            className="bgm-uploader__btn bgm-uploader__btn--remove"
          >
            삭제
          </button>
        )}
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={BGM_CONFIG.SUPPORTED_FORMATS.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* 에러 메시지 */}
      {error && <p className="bgm-uploader__error">{error}</p>}
    </div>
  );
};

export default BGMUploader;
