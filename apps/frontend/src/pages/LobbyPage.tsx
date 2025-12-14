import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useSocket } from '../hooks/useSocket';
import { useUserStore } from '../stores/useUserStore';
import { useRoomStore } from '../stores/useRoomStore';
import { GAME_CONFIG } from '@rhythm-game/shared';

const LobbyPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);

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

    createRoom(roomName.trim(), maxPlayers);
    setShowCreateModal(false);
    setRoomName('');
  };

  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId);
  };

  return (
    <div className="min-h-full p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl text-primary">대기방</h1>
          <p className="text-silver text-sm">{nickname}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>방 만들기</Button>
      </div>

      {/* Room List */}
      <div className="space-y-3">
        {rooms.length === 0 ? (
          <div className="card p-8 text-center text-silver">
            생성된 방이 없습니다
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.roomId}
              className="card p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium">{room.name}</h3>
                <p className="text-silver text-sm">
                  {room.playerCount}/{room.maxPlayers}명
                  {room.status === 'playing' && (
                    <span className="text-error ml-2">게임 중</span>
                  )}
                </p>
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
          ))
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-sm">
            <h2 className="font-display text-xl text-primary mb-4">
              방 만들기
            </h2>

            <form onSubmit={handleCreateRoom} className="space-y-4">
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
                  onClick={() => setShowCreateModal(false)}
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
