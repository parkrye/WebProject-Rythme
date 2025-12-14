import type { Player } from '@rhythm-game/shared';

interface PlayerListProps {
  players: Record<string, Player>;
  currentUserId: string | null;
  questionerId?: string | null;
  winnerId?: string | null;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, currentUserId, questionerId, winnerId }) => {
  const playerArray = Object.values(players);

  return (
    <div className="flex flex-wrap justify-center gap-3 p-4">
      {playerArray.map((player) => {
        const isMe = player.odId === currentUserId;
        const isQuestioner = player.odId === questionerId;
        const isWinner = player.odId === winnerId;

        return (
          <div
            key={player.odId}
            className={`
              card p-3 min-w-[80px] text-center transition-all
              ${isMe ? 'border-primary' : ''}
              ${isQuestioner ? 'ring-2 ring-primary' : ''}
              ${isWinner ? 'ring-2 ring-success bg-success/10 scale-105' : ''}
            `}
          >
            {isQuestioner && (
              <div className="text-primary text-lg mb-1">👑</div>
            )}
            {isWinner && !isQuestioner && (
              <div className="text-success text-lg mb-1">🏆</div>
            )}
            <div className="text-sm font-medium truncate">
              {player.nickname}
              {player.isAI && <span className="text-silver ml-1">(AI)</span>}
            </div>
            <div className={`font-mono text-lg mt-1 ${isWinner ? 'text-success' : 'text-primary'}`}>
              {player.score}
            </div>
            {player.isReady && (
              <div className="text-success text-xs mt-1">준비완료</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PlayerList;
