import PianoKey from './PianoKey';
import { WHITE_KEYS, BLACK_KEYS } from '@rhythm-game/shared';

interface PianoKeyboardProps {
  onNotePress: (note: string) => void;
  disabled?: boolean;
}

const BLACK_KEY_POSITIONS: Record<string, number> = {
  'C#4': 0,
  'D#4': 1,
  'F#4': 3,
  'G#4': 4,
  'A#4': 5,
};

const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ onNotePress, disabled = false }) => {
  return (
    <div className="relative flex justify-center items-start p-4">
      {/* White Keys */}
      <div className="flex">
        {WHITE_KEYS.map((note) => (
          <PianoKey
            key={note}
            note={note}
            isBlack={false}
            onPress={onNotePress}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Black Keys */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex">
        {WHITE_KEYS.slice(0, -1).map((_, index) => {
          const blackNote = BLACK_KEYS.find(
            (note) => BLACK_KEY_POSITIONS[note] === index
          );

          if (!blackNote) {
            return <div key={`spacer-${index}`} className="w-12" />;
          }

          return (
            <div key={blackNote} className="w-12 flex justify-center">
              <PianoKey
                note={blackNote}
                isBlack={true}
                onPress={onNotePress}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PianoKeyboard;
