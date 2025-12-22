import { useState, useCallback } from 'react';
import { NOTE_LABELS, INSTRUMENTS, type InstrumentType } from '@rhythm-game/shared';

// 악기별 키보드 테마
const INSTRUMENT_THEMES: Record<InstrumentType, {
  white: string;
  whitePressed: string;
  black: string;
  blackPressed: string;
  whiteText: string;
  blackText: string;
  border: string;
  decoration?: string; // 장식 클래스
}> = {
  // 피아노: 클래식 아이보리/블랙
  [INSTRUMENTS.PIANO]: {
    white: 'bg-ivory',
    whitePressed: 'bg-silver',
    black: 'bg-background',
    blackPressed: 'bg-surface',
    whiteText: 'text-background',
    blackText: 'text-silver',
    border: 'border-surface',
  },
  // 오르간: 진한 보라/마호가니
  [INSTRUMENTS.ORGAN]: {
    white: 'bg-gradient-to-b from-amber-100 to-amber-200',
    whitePressed: 'bg-amber-300',
    black: 'bg-gradient-to-b from-purple-900 to-purple-950',
    blackPressed: 'bg-purple-800',
    whiteText: 'text-purple-900',
    blackText: 'text-purple-300',
    border: 'border-purple-700',
    decoration: 'shadow-inner',
  },
  // 일렉 기타: 레드/오렌지 록 스타일
  [INSTRUMENTS.ELECTRIC_GUITAR]: {
    white: 'bg-gradient-to-b from-red-50 to-red-100',
    whitePressed: 'bg-red-200',
    black: 'bg-gradient-to-b from-red-800 to-red-900',
    blackPressed: 'bg-red-700',
    whiteText: 'text-red-800',
    blackText: 'text-red-300',
    border: 'border-red-600',
    decoration: 'shadow-lg',
  },
  // 베이스: 딥 블루/네이비
  [INSTRUMENTS.BASS]: {
    white: 'bg-gradient-to-b from-blue-100 to-blue-200',
    whitePressed: 'bg-blue-300',
    black: 'bg-gradient-to-b from-blue-900 to-blue-950',
    blackPressed: 'bg-blue-800',
    whiteText: 'text-blue-900',
    blackText: 'text-blue-300',
    border: 'border-blue-700',
    decoration: 'rounded-b-xl',
  },
  // 신스 리드: 네온 그린/시안
  [INSTRUMENTS.SYNTH_LEAD]: {
    white: 'bg-gradient-to-b from-cyan-100 to-emerald-100',
    whitePressed: 'bg-emerald-300',
    black: 'bg-gradient-to-b from-emerald-700 to-cyan-800',
    blackPressed: 'bg-cyan-600',
    whiteText: 'text-emerald-800',
    blackText: 'text-cyan-200',
    border: 'border-cyan-500',
    decoration: 'shadow-[0_0_10px_rgba(0,255,200,0.3)]',
  },
  // 신스 패드: 핑크/퍼플 그라데이션
  [INSTRUMENTS.SYNTH_PAD]: {
    white: 'bg-gradient-to-b from-pink-100 to-purple-100',
    whitePressed: 'bg-purple-200',
    black: 'bg-gradient-to-b from-pink-700 to-purple-800',
    blackPressed: 'bg-purple-600',
    whiteText: 'text-purple-800',
    blackText: 'text-pink-300',
    border: 'border-pink-500',
    decoration: 'rounded-b-2xl shadow-[0_0_15px_rgba(200,100,255,0.2)]',
  },
  // 비브라폰: 골드/브론즈 메탈릭
  [INSTRUMENTS.VIBRAPHONE]: {
    white: 'bg-gradient-to-b from-amber-50 to-yellow-100',
    whitePressed: 'bg-yellow-200',
    black: 'bg-gradient-to-b from-amber-700 to-amber-800',
    blackPressed: 'bg-amber-600',
    whiteText: 'text-amber-900',
    blackText: 'text-amber-200',
    border: 'border-amber-500',
    decoration: 'shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]',
  },
  // 칩튠: 레트로 게임 스타일 (픽셀 느낌의 그린)
  [INSTRUMENTS.CHIPTUNE]: {
    white: 'bg-gradient-to-b from-lime-200 to-lime-300',
    whitePressed: 'bg-lime-400',
    black: 'bg-gradient-to-b from-green-800 to-green-900',
    blackPressed: 'bg-green-700',
    whiteText: 'text-green-900',
    blackText: 'text-lime-300',
    border: 'border-green-600 border-2',
    decoration: 'rounded-none shadow-[2px_2px_0_rgba(0,0,0,0.5)]',
  },
  // 플루트: 라이트 블루/실버 공기 느낌
  [INSTRUMENTS.FLUTE]: {
    white: 'bg-gradient-to-b from-sky-50 to-slate-100',
    whitePressed: 'bg-sky-200',
    black: 'bg-gradient-to-b from-slate-600 to-slate-700',
    blackPressed: 'bg-slate-500',
    whiteText: 'text-slate-600',
    blackText: 'text-sky-200',
    border: 'border-sky-300',
    decoration: 'rounded-b-full',
  },
  // 브라스: 골드/옐로우 따뜻한 톤
  [INSTRUMENTS.BRASS]: {
    white: 'bg-gradient-to-b from-yellow-100 to-orange-100',
    whitePressed: 'bg-orange-200',
    black: 'bg-gradient-to-b from-yellow-700 to-orange-800',
    blackPressed: 'bg-orange-600',
    whiteText: 'text-orange-900',
    blackText: 'text-yellow-200',
    border: 'border-yellow-600',
    decoration: 'shadow-[0_2px_8px_rgba(255,180,0,0.3)]',
  },
};

interface PianoKeyProps {
  note: string;
  isBlack: boolean;
  onPress: (note: string) => void;
  disabled?: boolean;
  instrument?: InstrumentType;
}

const PianoKey: React.FC<PianoKeyProps> = ({
  note,
  isBlack,
  onPress,
  disabled = false,
  instrument = INSTRUMENTS.PIANO,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const theme = INSTRUMENT_THEMES[instrument];

  const handlePress = useCallback(() => {
    if (disabled) return;
    setIsPressed(true);
    onPress(note);
  }, [note, onPress, disabled]);

  const handleRelease = useCallback(() => {
    setIsPressed(false);
  }, []);

  // 기본 크기/레이아웃 클래스
  const sizeClass = isBlack
    ? 'w-8 h-24 -mx-4 z-10'
    : 'w-12 h-36';

  // 악기별 기본 둥글기 (decoration에서 오버라이드 가능)
  const defaultRounding = isBlack ? 'rounded-b-md' : 'rounded-b-lg';

  // 악기별 색상 클래스
  const colorClass = isBlack
    ? isPressed ? theme.blackPressed : theme.black
    : isPressed ? theme.whitePressed : theme.white;

  // 눌림 효과
  const pressedScale = isPressed
    ? isBlack ? 'scale-95' : 'scale-[0.98]'
    : '';

  const disabledClass = disabled ? 'opacity-50' : '';

  return (
    <button
      className={`
        ${sizeClass}
        ${defaultRounding}
        ${colorClass}
        ${pressedScale}
        ${disabledClass}
        ${theme.decoration || ''}
        relative flex items-end justify-center pb-2
        transition-all duration-100
        touch-none select-none
        border ${theme.border}
      `}
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      disabled={disabled}
    >
      <span
        className={`
          text-xs font-medium
          ${isBlack ? theme.blackText : theme.whiteText}
        `}
      >
        {NOTE_LABELS[note]}
      </span>
    </button>
  );
};

export default PianoKey;
