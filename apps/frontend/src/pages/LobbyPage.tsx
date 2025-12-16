import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useSocket } from '../hooks/useSocket';
import { useUserStore } from '../stores/useUserStore';
import { useRoomStore } from '../stores/useRoomStore';
import {
  GAME_CONFIG,
  ROOM_MODES,
  ROOM_MODE_LABELS,
  ROOM_MODE_DESCRIPTIONS,
  ROOM_MODE_ICONS,
  ROOM_MODE_THEMES,
  DEFAULT_ROOM_MODE,
  type RoomMode,
} from '@rhythm-game/shared';

const LobbyPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [roomMode, setRoomMode] = useState<RoomMode>(DEFAULT_ROOM_MODE);

  const navigate = useNavigate();
  const nickname = useUserStore((state) => state.nickname);
  const { rooms, currentRoom } = useRoomStore();
  const { createRoom, joinRoom } = useSocket();

  useEffect(() => {
    if (currentRoom) {
      navigate(`/room/${currentRoom.roomId}`);
    }
  }, [currentRoom, navigate]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    createRoom(roomName.trim(), maxPlayers, roomMode);
    setShowCreateModal(false);
    setRoomName('');
    setRoomMode(DEFAULT_ROOM_MODE);
  };

  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId);
  };

  const handleSoloRoom = () => {
    navigate('/solo');
  };

  return (
    <div className="min-h-full p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl text-primary">대기방</h1>
          <p className="text-silver text-sm">{nickname}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSoloRoom}>
            개인방
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>방 만들기</Button>
        </div>
      </div>

      {/* Solo Room Card */}
      <div
        onClick={handleSoloRoom}
        className="card p-4 mb-4 cursor-pointer hover:border-primary transition-colors bg-gradient-to-r from-surface to-surface-light"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-display text-lg text-secondary">개인방</h3>
            <p className="text-silver text-sm">
              혼자서 연습하거나 AI와 대결해보세요
            </p>
          </div>
          <span className="text-2xl">🎹</span>
        </div>
      </div>

      {/* Room List */}
      <div className="space-y-3">
        {rooms.length === 0 ? (
          <div className="card p-8 text-center text-silver">
            생성된 방이 없습니다
          </div>
        ) : (
          rooms.map((room) => {
            const theme = ROOM_MODE_THEMES[room.mode || ROOM_MODES.GAME];
            const icon = ROOM_MODE_ICONS[room.mode || ROOM_MODES.GAME];
            const modeLabel = ROOM_MODE_LABELS[room.mode || ROOM_MODES.GAME];

            return (
              <div
                key={room.roomId}
                className={`card p-4 flex justify-between items-center transition-all ${theme.border} border-opacity-50 hover:border-opacity-100`}
              >
                <div className="flex items-center gap-3">
                  {/* 모드 아이콘 */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${theme.bg}`}
                  >
                    {icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{room.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${theme.bg} ${theme.primary}`}
                      >
                        {modeLabel}
                      </span>
                    </div>
                    <p className="text-silver text-sm">
                      {room.playerCount}/{room.maxPlayers}명
                      {room.status === 'playing' && (
                        <span className="text-error ml-2">
                          {room.mode === ROOM_MODES.ENSEMBLE
                            ? '연주 중'
                            : '게임 중'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => handleJoinRoom(room.roomId)}
                  disabled={
                    room.playerCount >= room.maxPlayers ||
                    room.status !== 'waiting'
                  }
                >
                  입장
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="font-display text-xl text-primary mb-4">
              방 만들기
            </h2>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              {/* 모드 선택 */}
              <div>
                <label className="block text-silver text-sm mb-3">
                  게임 모드
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(ROOM_MODES).map((mode) => {
                    const theme = ROOM_MODE_THEMES[mode];
                    const isSelected = roomMode === mode;

                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setRoomMode(mode)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? `${theme.border} ${theme.bg}`
                            : 'border-surface-light hover:border-silver'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">
                            {ROOM_MODE_ICONS[mode]}
                          </span>
                          <span
                            className={`font-display ${
                              isSelected ? theme.primary : 'text-white'
                            }`}
                          >
                            {ROOM_MODE_LABELS[mode]}
                          </span>
                        </div>
                        <p className="text-xs text-silver">
                          {ROOM_MODE_DESCRIPTIONS[mode]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                label="방 이름"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="방 이름을 입력하세요"
                maxLength={20}
                autoFocus
              />

              <div>
                <label className="block text-silver text-sm mb-2">
                  최대 인원
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="input-field w-full"
                >
                  {Array.from(
                    { length: GAME_CONFIG.MAX_PLAYERS - 1 },
                    (_, i) => i + 2
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n}명
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowCreateModal(false);
                    setRoomMode(DEFAULT_ROOM_MODE);
                  }}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!roomName.trim()}
                >
                  생성
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbyPage;
