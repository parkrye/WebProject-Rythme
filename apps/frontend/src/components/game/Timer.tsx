import { useState, useEffect } from 'react';

interface TimerProps {
  endTime: number | null;
  onComplete?: () => void;
}

const Timer: React.FC<TimerProps> = ({ endTime, onComplete }) => {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!endTime) {
      setRemaining(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, endTime - now);
      setRemaining(Math.ceil(diff / 1000));

      if (diff <= 0 && onComplete) {
        onComplete();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  const isLow = remaining <= 3;

  return (
    <div
      className={`
        font-mono text-4xl font-bold
        ${isLow ? 'text-error animate-pulse' : 'text-primary'}
      `}
    >
      {remaining}
    </div>
  );
};

export default Timer;
