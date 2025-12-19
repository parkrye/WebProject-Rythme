import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/common/Button';
import PianoKeyboard from '../components/game/PianoKeyboard';
import PlayerList from '../components/game/PlayerList';
import Timer from '../components/game/Timer';
import { usePiano } from '../hooks/usePiano';
import { useHostGameLogic } from '../hooks/useHostGameLogic';
import { useUserStore } from '../stores/useUserStore';
import { useRoomStore } from '../stores/useRoomStore';
import { useGameStore } from '../stores/useGameStore';
import { useFirebaseRoom } from '../hooks/useFirebaseRooms';
import { useFirebaseGameSync } from '../hooks/useFirebaseGame';
import { firebaseRealtimeService } from '../services/firebaseRealtimeService';
import { playMelody, playNote as playNoteSound } from '../utils/audioUtils';
import { calculateSimilarity } from '../utils/soloAI';
import {
  ROOM_MODES,
  ROOM_MODE_LABELS,
  ROOM_MODE_ICONS,
  ROOM_MODE_THEMES,
  DEFAULT_INSTRUMENT,
  type InstrumentType,
} from '@rhythm-game/shared';

const PHASE_LABELS: Record<string, string> = {
  idle: '대기 중',
  recording: '녹음 중',
  listening: '문제 듣기',
  challenging: '도전 중',
  judging: '판정 중',
  result: '결과',
};

const GameRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const odId = useUserStore((state) => state.odId);
  const nickname = useUserStore((state) => state.nickname);
  const { currentRoom, setCurrentRoom } = useRoomStore();

  // Firebase Realtime으로 방 정보와 게임 상태 실시간 구독
  useFirebaseRoom(roomId || null);
  useFirebaseGameSync(roomId || null);
  const {
    phase,
    questionerId,
    endTime,
    questionNotes,
    roundResult,
    finalResult,
    isRecording,
    recordedNotes,
    challengeNotes,
    setIsRecording,
    clearRecordedNotes,
    clearChallengeNotes,
  } = useGameStore();

  const { handleNotePress, startRecording, stopRecording, stopChallenge } = usePiano();

  const isEnsembleMode = currentRoom?.mode === ROOM_MODES.ENSEMBLE;
  const isHost = currentRoom?.hostId === odId;
  const isQuestioner = questionerId === odId;
  const players = currentRoom?.players || {};
  const playerCount = Object.keys(players).length;
  const maxPlayers = currentRoom?.maxPlayers || 6;
  const canAddAI = isHost && playerCount < maxPlayers && currentRoom?.status === 'waiting';
  const allReady = Object.values(players).every((p) => p.isReady || p.odId === currentRoom?.hostId);

  // 호스트 게임 로직 훅
  const { handleStartGame: hostStartGame } = useHostGameLogic({
    roomId: roomId || '',
    isHost,
  });

  const [isPlaying, setIsPlaying] = useState<'question' | 'winner' | null>(null);
  const [instrument] = useState<InstrumentType>(DEFAULT_INSTRUMENT);
  const [lastPlayedNote, setLastPlayedNote] = useState<{ nickname: string; note: string } | null>(null);
  const stopPlaybackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!currentRoom) {
      navigate('/lobby');
    }
  }, [currentRoom, navigate]);

  // Ensemble mode: listen for notes from other players via Firebase
  useEffect(() => {
    if (!isEnsembleMode || !roomId || !odId) {
      return;
    }

    const unsubscribe = firebaseRealtimeService.subscribeToEnsembleNotes(
      roomId,
      odId,
      (payload) => {
        playNoteSound(payload.note, 0.5, payload.instrument);
        setLastPlayedNote({ nickname: payload.nickname, note: payload.note });
        setTimeout(() => setLastPlayedNote(null), 500);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isEnsembleMode, roomId, odId]);

  // listening 페이즈에서 자동 재생
  useEffect(() => {
    if (phase === 'listening' && questionNotes.length > 0) {
      setIsPlaying('question');
      const stop = playMelody(questionNotes, () => {
        setIsPlaying(null);
      });
      stopPlaybackRef.current = stop;
      return () => {
        stop();
        setIsPlaying(null);
      };
    }
  }, [phase, questionNotes]);

  // 페이즈 변경 시 재생 중지
  useEffect(() => {
    if (phase !== 'result' && phase !== 'listening') {
      stopPlaybackRef.current?.();
      setIsPlaying(null);
    }
  }, [phase]);

  const handlePlayQuestion = useCallback(() => {
    if (isPlaying) {
      stopPlaybackRef.current?.();
      setIsPlaying(null);
      return;
    }
    const notes = roundResult?.questionNotes || questionNotes;
    if (notes.length === 0) return;

    setIsPlaying('question');
    stopPlaybackRef.current = playMelody(notes, () => setIsPlaying(null));
  }, [isPlaying, roundResult, questionNotes]);

  const handlePlayWinner = useCallback(() => {
    if (isPlaying) {
      stopPlaybackRef.current?.();
      setIsPlaying(null);
      return;
    }
    if (!roundResult?.winnerNotes?.length) return;

    setIsPlaying('winner');
    stopPlaybackRef.current = playMelody(roundResult.winnerNotes, () => setIsPlaying(null));
  }, [isPlaying, roundResult]);

  const handleLeave = useCallback(async () => {
    if (roomId && odId) {
      await firebaseRealtimeService.leaveRoom(roomId, odId);
      setCurrentRoom(null);
      navigate('/lobby');
    }
  }, [roomId, odId, setCurrentRoom, navigate]);

  const handleReady = useCallback(async () => {
    if (!roomId || !odId) return;
    const player = players[odId];
    if (player) {
      await firebaseRealtimeService.setReady(roomId, odId, !player.isReady);
    }
  }, [roomId, odId, players]);

  const handleStartGame = useCallback(() => {
    if (isHost) {
      hostStartGame();
    }
  }, [isHost, hostStartGame]);

  const handleAddAI = useCallback(async () => {
    if (roomId) {
      await firebaseRealtimeService.addAI(roomId, 'easy');
    }
  }, [roomId]);

  // Ensemble mode: handle note press and broadcast to others via Firebase
  const handleEnsembleNotePress = useCallback(async (note: string) => {
    playNoteSound(note, 0.5, instrument);
    if (roomId && odId && nickname) {
      await firebaseRealtimeService.playEnsembleNote(roomId, odId, nickname, note, instrument);
    }
  }, [roomId, odId, nickname, instrument]);

  const handleStartRecording = useCallback(() => {
    clearRecordedNotes();
    startRecording();
    setIsRecording(true);
  }, [clearRecordedNotes, startRecording, setIsRecording]);

  const handleStopRecording = useCallback(async () => {
    const notes = stopRecording();
    setIsRecording(false);
    if (roomId && odId && notes.length > 0) {
      await firebaseRealtimeService.submitRecording(roomId, odId, notes);
    }
  }, [roomId, odId, stopRecording, setIsRecording]);

  const handleStartChallenge = useCallback(() => {
    clearChallengeNotes();
    startRecording();
    setIsRecording(true);
  }, [clearChallengeNotes, startRecording, setIsRecording]);

  const handleStopChallenge = useCallback(async () => {
    const notes = stopChallenge();
    setIsRecording(false);
    if (roomId && odId && notes.length > 0) {
      // 유사도 계산
      const questionNotesWithInstrument = questionNotes.map((n) => ({
        ...n,
        instrument: 'piano' as const,
      }));
      const challengeNotesWithInstrument = notes.map((n) => ({
        ...n,
        instrument: 'piano' as const,
      }));
      const result = calculateSimilarity(questionNotesWithInstrument, challengeNotesWithInstrument);
      await firebaseRealtimeService.submitChallenge(roomId, odId, notes, result.total);
    }
  }, [roomId, odId, questionNotes, stopChallenge, setIsRecording]);

  if (!currentRoom) {
    return null;
  }

  // In ensemble mode, everyone can play when status is "playing"
  // In game mode, only during specific phases with recording active
  const canPlay = isEnsembleMode
    ? currentRoom.status === 'playing'
    : (phase === 'recording' && isQuestioner && isRecording) ||
      (phase === 'challenging' && !isQuestioner && isRecording);

  const theme = isEnsembleMode
    ? ROOM_MODE_THEMES[ROOM_MODES.ENSEMBLE]
    : ROOM_MODE_THEMES[ROOM_MODES.GAME];

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className={`p-4 flex justify-between items-center border-b ${isEnsembleMode ? 'border-secondary/30' : 'border-surface'}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {isEnsembleMode ? ROOM_MODE_ICONS[ROOM_MODES.ENSEMBLE] : ROOM_MODE_ICONS[ROOM_MODES.GAME]}
          </span>
          <div>
            <h1 className={`font-medium ${theme.primary}`}>{currentRoom.name}</h1>
            {isEnsembleMode ? (
              <p className="text-silver text-sm">
                {ROOM_MODE_LABELS[ROOM_MODES.ENSEMBLE]}
              </p>
            ) : (
              <p className="text-silver text-sm">
                라운드 {currentRoom.currentRound}/{currentRoom.totalRounds}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isEnsembleMode && phase !== 'idle' && <Timer endTime={endTime} />}
          <Button variant="secondary" onClick={handleLeave}>
            나가기
          </Button>
        </div>
      </div>

      {/* Game Phase (Game Mode only) */}
      {!isEnsembleMode && (
        <div className="text-center py-4">
          <span className="text-primary font-medium">
            {PHASE_LABELS[phase]}
          </span>
          {questionerId && players[questionerId] && (
            <span className="text-silver ml-2">
              출제자: {players[questionerId].nickname}
            </span>
          )}
        </div>
      )}

      {/* Ensemble Mode: Now Playing Indicator */}
      {isEnsembleMode && lastPlayedNote && (
        <div className="text-center py-2 animate-pulse">
          <span className="text-secondary">
            {lastPlayedNote.nickname}: {lastPlayedNote.note}
          </span>
        </div>
      )}

      {/* Players */}
      <PlayerList
        players={players}
        currentUserId={odId}
        questionerId={questionerId}
        winnerId={phase === 'result' ? roundResult?.winnerId : null}
      />

      {/* Listening Phase (Game Mode only) */}
      {!isEnsembleMode && phase === 'listening' && (
        <div className="card mx-4 p-4 text-center">
          <p className="text-primary font-medium mb-2">출제자의 연주를 듣고 있습니다...</p>
          <div className="flex justify-center">
            <span className={`inline-block w-3 h-3 rounded-full ${isPlaying === 'question' ? 'bg-primary animate-pulse' : 'bg-silver'}`} />
          </div>
        </div>
      )}

      {/* Result Display (Game Mode only) */}
      {!isEnsembleMode && roundResult && phase === 'result' && (
        <div className="card mx-4 p-4">
          <div className="text-center mb-4">
            <p className="text-primary font-medium text-lg">
              {roundResult.winnerId
                ? `승자: ${players[roundResult.winnerId]?.nickname}`
                : '도전자 없음'}
            </p>
            <p className="text-silver">
              유사도: {Math.round(roundResult.winnerSimilarity)}% ({roundResult.grade})
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              variant={isPlaying === 'question' ? 'primary' : 'secondary'}
              onClick={handlePlayQuestion}
            >
              {isPlaying === 'question' ? '정지' : '출제 연주'}
            </Button>
            {roundResult.winnerId && roundResult.winnerNotes?.length > 0 && (
              <Button
                variant={isPlaying === 'winner' ? 'primary' : 'secondary'}
                onClick={handlePlayWinner}
              >
                {isPlaying === 'winner' ? '정지' : '승자 연주'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Final Result (Game Mode only) */}
      {!isEnsembleMode && finalResult && (
        <div className="card mx-4 p-4">
          <h2 className="text-primary font-display text-xl text-center mb-4">
            최종 결과
          </h2>
          {finalResult.rankings.map((ranking) => (
            <div
              key={ranking.odId}
              className={`flex justify-between py-2 ${
                ranking.rank === 1 ? 'text-primary' : ''
              }`}
            >
              <span>
                {ranking.rank}. {ranking.nickname}
              </span>
              <span className="font-mono">{ranking.score}점</span>
            </div>
          ))}
        </div>
      )}

      {/* Piano */}
      <div className="flex-1 flex flex-col justify-end">
        <PianoKeyboard
          onNotePress={isEnsembleMode ? handleEnsembleNotePress : handleNotePress}
          disabled={!canPlay}
        />
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        {/* Ensemble Mode Actions */}
        {isEnsembleMode && (
          <>
            {currentRoom.status === 'waiting' ? (
              <>
                {isHost ? (
                  <Button
                    className="w-full"
                    onClick={handleStartGame}
                    disabled={playerCount < 1}
                  >
                    연주 시작
                  </Button>
                ) : (
                  <p className="text-center text-silver">
                    방장이 연주를 시작할 때까지 대기 중...
                  </p>
                )}
                <p className="text-silver text-xs text-center">
                  {playerCount}/{maxPlayers}명 참가 중
                </p>
              </>
            ) : (
              <div className="text-center">
                <p className={`${theme.primary} font-medium`}>
                  자유롭게 연주하세요
                </p>
                <p className="text-silver text-xs mt-1">
                  다른 플레이어의 연주가 실시간으로 들립니다
                </p>
              </div>
            )}
          </>
        )}

        {/* Game Mode Actions */}
        {!isEnsembleMode && (
          <>
            {currentRoom.status === 'waiting' && (
              <>
                {isHost ? (
                  <>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={handleStartGame}
                        disabled={playerCount < 2 || !allReady}
                      >
                        게임 시작
                      </Button>
                      {canAddAI && (
                        <Button
                          variant="secondary"
                          onClick={handleAddAI}
                        >
                          AI 추가
                        </Button>
                      )}
                    </div>
                    <p className="text-silver text-xs text-center">
                      {playerCount}/{maxPlayers}명 참가 중
                    </p>
                  </>
                ) : (
                  <Button
                    className="w-full"
                    variant={players[odId!]?.isReady ? 'secondary' : 'primary'}
                    onClick={handleReady}
                  >
                    {players[odId!]?.isReady ? '준비 취소' : '준비'}
                  </Button>
                )}
              </>
            )}

            {phase === 'recording' && isQuestioner && (
              <Button
                className="w-full"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
              >
                {isRecording ? `녹음 완료 (${recordedNotes.length}음)` : '녹음 시작'}
              </Button>
            )}

            {phase === 'challenging' && !isQuestioner && (
              <Button
                className="w-full"
                onClick={isRecording ? handleStopChallenge : handleStartChallenge}
              >
                {isRecording ? `제출 (${challengeNotes.length}음)` : '녹음 시작'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GameRoomPage;
