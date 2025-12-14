import { useState, useCallback } from 'react';
import { NOTE_LABELS } from '@rhythm-game/shared';

interface PianoKeyProps {
  note: string;
  isBlack: boolean;
  onPress: (note: string) => void;
  disabled?: boolean;
}

const PianoKey: React.FC<PianoKeyProps> = ({ note, isBlack, onPress, disabled = false }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback(() => {
    if (disabled) return;
    setIsPressed(true);
    onPress(note);
  }, [note, onPress, disabled]);

  const handleRelease = useCallback(() => {
    setIsPressed(false);
  }, []);

  const baseClass = isBlack
    ? 'bg-background w-8 h-24 -mx-4 z-10 rounded-b-md'
    : 'bg-ivory w-12 h-36 rounded-b-lg';

  const pressedClass = isPressed
    ? isBlack
      ? 'bg-surface scale-95'
      : 'bg-silver scale-[0.98]'
    : '';

  const disabledClass = disabled ? 'opacity-50' : '';

  return (
    <button
      className={`
        ${baseClass}
        ${pressedClass}
        ${disabledClass}
        relative flex items-end justify-center pb-2
        transition-all duration-100
        touch-none select-none
        border border-surface
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
          ${isBlack ? 'text-silver' : 'text-background'}
        `}
      >
        {NOTE_LABELS[note]}
      </span>
    </button>
  );
};

export default PianoKey;
