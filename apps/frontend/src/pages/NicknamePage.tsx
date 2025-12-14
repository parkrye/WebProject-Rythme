import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useUserStore } from '../stores/useUserStore';
import { resumeAudioContext } from '../utils/audioUtils';

const NicknamePage: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) return;

    setIsLoading(true);

    try {
      await resumeAudioContext();

      const odId = crypto.randomUUID();
      setUser(odId, nickname.trim());
      navigate('/lobby');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6">
      <div className="card p-8 w-full max-w-sm">
        <h1 className="font-display text-3xl text-primary text-center mb-2">
          Piano Rhythm
        </h1>
        <p className="text-silver text-center mb-8">
          멜로디를 듣고 따라해보세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="닉네임"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            maxLength={12}
            autoFocus
          />

          <Button
            type="submit"
            className="w-full"
            disabled={!nickname.trim() || isLoading}
          >
            {isLoading ? '입장 중...' : '입장하기'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NicknamePage;
