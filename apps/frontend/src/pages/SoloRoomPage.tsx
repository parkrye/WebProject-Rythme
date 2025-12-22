import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SOLO_CONFIG,
  SOLO_MODE_LABELS,
  SOLO_MODE_DESCRIPTIONS,
  SIMILARITY_LABELS,
  INSTRUMENTS,
  INSTRUMENT_LABELS,
  BGM_TYPES,
  type SoloMode,
  type AIDifficulty,
  type InstrumentType,
  type BGMKey,
} from '@rhythm-game/shared';
import Button from '../components/common/Button';
import PianoKeyboard from '../components/game/PianoKeyboard';
import { useSoloStore } from '../stores/useSoloStore';
import { usePiano } from '../hooks/usePiano';
import { playMelody, type NoteWithTimestamp } from '../utils/audioUtils';
import {
  generateAIMelody,
  generateAIChallengeAnswer,
  calculateSimilarity,
  getGrade,
} from '../utils/soloAI';
import {
  createMelodyFile,
  createBGMMelodyFile,
  downloadMelodyFile,
  saveBGMMelodyToStorage,
} from '../utils/melodyFile';
import type { Note } from '@rhythm-game/shared';

const DIFFICULTY_LABELS: Record<AIDifficulty, string> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
};

const INSTRUMENT_LIST = Object.values(INSTRUMENTS) as InstrumentType[];

const SoloRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    mode,
    phase,
    difficulty,
    instrument,
    questionMelody,
    answerMelody,
    aiAnswerMelody,
    result,
    aiResult,
    remainingTime,
    setMode,
    setPhase,
    setDifficulty,
    setInstrument,
    setQuestionMelody,
    setAnswerMelody,
    setAiAnswerMelody,
    setResult,
    setAiResult,
    setRemainingTime,
    reset,
  } = useSoloStore();

  const [isRecording, setIsRecording] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveTarget, setSaveTarget] = useState<'file' | BGMKey>('file');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const recordingRef = useRef<NoteWithTimestamp[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const { playNote } = usePiano();

  // 키보드 활성화 조건
  const isKeyboardEnabled =
    phase === 'free-play' ||
    (phase === 'ai-challenge' && isRecording) ||
    (phase === 'recording' && isRecording);

  // 녹음 시작
  const startRecording = useCallback(() => {
    setIsRecording(true);
    recordingRef.current = [];
    recordingStartTimeRef.current = Date.now();

    // 타이머 시작
    const duration = SOLO_CONFIG.CHALLENGE_TIME_MS;
    setRemainingTime(duration);

    timerRef.current = window.setInterval(() => {
      setRemainingTime((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          stopRecording();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [setRemainingTime]);

  // 녹음 종료
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 건반 누름 핸들러
  const handleNotePress = useCallback(
    (note: string) => {
      if (!isKeyboardEnabled) return;

      playNote(note, 0.5, instrument);

      if (isRecording) {
        recordingRef.current.push({
          note,
          timestamp: Date.now() - recordingStartTimeRef.current,
          instrument,
        });
      }
    },
    [isKeyboardEnabled, isRecording, playNote, instrument]
  );

  // 모드 선택
  const handleModeSelect = (selectedMode: SoloMode) => {
    setMode(selectedMode);

    if (selectedMode === SOLO_CONFIG.MODES.FREE_PLAY) {
      setPhase('free-play');
    } else if (selectedMode === SOLO_CONFIG.MODES.CHALLENGE_AI) {
      // AI 멜로디 생성 후 재생 (랜덤 악기)
      const aiMelody = generateAIMelody(difficulty);
      setQuestionMelody(aiMelody);
      // AI가 사용한 악기로 설정 (따라하기 위해)
      if (aiMelody[0]?.instrument) {
        setInstrument(aiMelody[0].instrument);
      }
      setPhase('ai-listening');

      // 멜로디 재생 후 도전 시작
      setTimeout(() => {
        playMelody(aiMelody, () => {
          setPhase('ai-challenge');
        });
      }, 1000);
    } else if (selectedMode === SOLO_CONFIG.MODES.CREATE_QUIZ) {
      setPhase('recording');
    }
  };

  // AI 도전 제출
  const handleSubmitChallenge = useCallback(() => {
    stopRecording();
    setAnswerMelody(recordingRef.current);

    // 유사도 계산
    const similarity = calculateSimilarity(questionMelody, recordingRef.current);
    setResult({
      similarity: similarity.total,
      grade: getGrade(similarity.total),
      details: similarity.details,
    });

    setPhase('result');
  }, [questionMelody, setAnswerMelody, setResult, setPhase, stopRecording]);

  // 출제 완료 (AI가 도전)
  const handleSubmitQuiz = useCallback(() => {
    stopRecording();
    setQuestionMelody(recordingRef.current);
    setPhase('ai-challenging');

    // AI 도전 시뮬레이션
    setTimeout(() => {
      const aiAnswer = generateAIChallengeAnswer(recordingRef.current, difficulty);
      setAiAnswerMelody(aiAnswer);

      // AI 결과 계산
      const similarity = calculateSimilarity(recordingRef.current, aiAnswer);
      setAiResult({
        similarity: similarity.total,
        grade: getGrade(similarity.total),
        details: similarity.details,
      });

      setPhase('result');
    }, 2000);
  }, [difficulty, setQuestionMelody, setAiAnswerMelody, setAiResult, setPhase, stopRecording]);

  // 다시 하기
  const handleRetry = () => {
    setQuestionMelody([]);
    setAnswerMelody([]);
    setAiAnswerMelody([]);
    setResult(null);
    setAiResult(null);
    setRemainingTime(0);
    setPhase('mode-select');
    setMode(null);
  };

  // 나가기
  const handleExit = () => {
    reset();
    navigate('/lobby');
  };

  // 멜로디 재생
  const handlePlayMelody = (melody: NoteWithTimestamp[]) => {
    playMelody(melody);
  };

  // 저장 모달 열기
  const handleOpenSaveModal = (melody: NoteWithTimestamp[]) => {
    if (melody.length === 0) return;
    setSaveName('');
    setSaveTarget('file');
    setSaveMessage(null);
    setShowSaveModal(true);
  };

  // NoteWithTimestamp를 Note로 변환
  const convertToNotes = (melody: NoteWithTimestamp[]): Note[] => {
    return melody.map(({ note, timestamp }) => ({ note, timestamp }));
  };

  // 저장 실행
  const handleSave = async () => {
    const melodyToSave = questionMelody.length > 0 ? questionMelody : answerMelody;
    if (melodyToSave.length === 0 || !saveName.trim()) return;

    const notes = convertToNotes(melodyToSave);
    const melodyInstrument = melodyToSave[0]?.instrument || instrument;

    try {
      if (saveTarget === 'file') {
        // 파일로 다운로드
        const file = createMelodyFile(saveName.trim(), notes, melodyInstrument);
        downloadMelodyFile(file);
        setSaveMessage('파일이 다운로드되었습니다!');
      } else {
        // BGM으로 저장
        const bgmFile = createBGMMelodyFile(saveName.trim(), notes, melodyInstrument);
        await saveBGMMelodyToStorage(saveTarget, bgmFile);
        setSaveMessage(`${saveTarget} BGM으로 저장되었습니다!`);
      }

      setTimeout(() => {
        setShowSaveModal(false);
        setSaveMessage(null);
      }, 1500);
    } catch (error) {
      console.error('저장 실패:', error);
      setSaveMessage('저장에 실패했습니다.');
    }
  };

  // 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-full p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="font-display text-2xl text-primary">개인방</h1>
          {mode && (
            <p className="text-secondary text-sm">{SOLO_MODE_LABELS[mode]}</p>
          )}
        </div>
        <Button variant="secondary" onClick={handleExit}>
          나가기
        </Button>
      </div>

      {/* 모드 선택 */}
      {phase === 'mode-select' && (
        <div className="flex-1 flex flex-col justify-center">
          {/* 난이도 선택 */}
          <div className="mb-4 text-center">
            <p className="text-silver text-sm mb-2">AI 난이도</p>
            <div className="flex justify-center gap-2">
              {(['easy', 'normal', 'hard'] as AIDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    difficulty === d
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-surface-light text-silver hover:border-secondary'
                  }`}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {/* 악기 선택 */}
          <div className="mb-6 text-center">
            <p className="text-silver text-sm mb-2">악기 선택</p>
            <div className="flex flex-wrap justify-center gap-2">
              {INSTRUMENT_LIST.map((inst) => (
                <button
                  key={inst}
                  onClick={() => setInstrument(inst)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    instrument === inst
                      ? 'border-secondary bg-secondary/20 text-secondary'
                      : 'border-surface-light text-silver hover:border-accent'
                  }`}
                >
                  {INSTRUMENT_LABELS[inst]}
                </button>
              ))}
            </div>
          </div>

          {/* 모드 버튼 */}
          <div className="space-y-3">
            {Object.values(SOLO_CONFIG.MODES).map((m) => (
              <button
                key={m}
                onClick={() => handleModeSelect(m as SoloMode)}
                className="card p-4 w-full text-left hover:border-primary transition-colors"
              >
                <h3 className="font-display text-lg text-primary">
                  {SOLO_MODE_LABELS[m]}
                </h3>
                <p className="text-silver text-sm">{SOLO_MODE_DESCRIPTIONS[m]}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 자유 연습 모드 */}
      {phase === 'free-play' && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <p className="text-silver">자유롭게 연주하세요</p>
          </div>
          <div className="mt-4">
            <Button onClick={handleRetry} className="w-full">
              모드 선택으로
            </Button>
          </div>
        </div>
      )}

      {/* AI 멜로디 듣기 */}
      {phase === 'ai-listening' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-primary mb-2">멜로디를 들어보세요</p>
            <p className="text-silver">잘 기억해두세요!</p>
          </div>
        </div>
      )}

      {/* AI 도전 */}
      {phase === 'ai-challenge' && (
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-4">
            {isRecording ? (
              <>
                <p className="text-xl text-error">녹음 중...</p>
                <p className="text-2xl font-display text-primary">
                  {Math.ceil(remainingTime / 1000)}초
                </p>
              </>
            ) : (
              <p className="text-silver">녹음 버튼을 눌러 시작하세요</p>
            )}
          </div>

          <div className="flex gap-2 justify-center mb-4">
            {!isRecording ? (
              <>
                <Button onClick={startRecording}>녹음 시작</Button>
                <Button
                  variant="secondary"
                  onClick={() => handlePlayMelody(questionMelody)}
                >
                  다시 듣기
                </Button>
              </>
            ) : (
              <Button onClick={handleSubmitChallenge}>제출</Button>
            )}
          </div>
        </div>
      )}

      {/* 문제 출제 (녹음) */}
      {phase === 'recording' && (
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-4">
            {isRecording ? (
              <>
                <p className="text-xl text-error">녹음 중...</p>
                <p className="text-2xl font-display text-primary">
                  {Math.ceil(remainingTime / 1000)}초
                </p>
              </>
            ) : (
              <p className="text-silver">멜로디를 녹음하세요</p>
            )}
          </div>

          <div className="flex gap-2 justify-center mb-4">
            {!isRecording ? (
              <Button onClick={startRecording}>녹음 시작</Button>
            ) : (
              <Button onClick={handleSubmitQuiz}>제출</Button>
            )}
          </div>
        </div>
      )}

      {/* AI 도전 중 */}
      {phase === 'ai-challenging' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-secondary mb-2">AI가 도전 중...</p>
            <div className="animate-pulse text-4xl">🤖</div>
          </div>
        </div>
      )}

      {/* 결과 */}
      {phase === 'result' && (
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-6">
            <p className="text-xl text-primary mb-2">결과</p>

            {/* 내 결과 (AI 도전 모드) */}
            {result && (
              <div className="card p-4 mb-4">
                <p className="text-silver text-sm mb-1">내 점수</p>
                <p className="text-3xl font-display text-primary">
                  {result.similarity}%
                </p>
                <p className="text-lg text-secondary">{result.grade}</p>

                {/* 세부 점수 */}
                <div className="mt-4 space-y-2">
                  {Object.entries(result.details).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-silver text-sm w-20">
                        {SIMILARITY_LABELS[key as keyof typeof SIMILARITY_LABELS]}
                      </span>
                      <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="text-sm w-12 text-right">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI 결과 (출제 모드) */}
            {aiResult && (
              <div className="card p-4 mb-4">
                <p className="text-silver text-sm mb-1">AI 점수</p>
                <p className="text-3xl font-display text-secondary">
                  {aiResult.similarity}%
                </p>
                <p className="text-lg text-accent">{aiResult.grade}</p>

                {/* 세부 점수 */}
                <div className="mt-4 space-y-2">
                  {Object.entries(aiResult.details).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-silver text-sm w-20">
                        {SIMILARITY_LABELS[key as keyof typeof SIMILARITY_LABELS]}
                      </span>
                      <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-secondary to-accent"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="text-sm w-12 text-right">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 재생 버튼 */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {questionMelody.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => handlePlayMelody(questionMelody)}
              >
                출제곡 재생
              </Button>
            )}
            {answerMelody.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => handlePlayMelody(answerMelody)}
              >
                내 연주 재생
              </Button>
            )}
            {aiAnswerMelody.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => handlePlayMelody(aiAnswerMelody)}
              >
                AI 연주 재생
              </Button>
            )}
          </div>

          {/* 저장 버튼 */}
          {(questionMelody.length > 0 || answerMelody.length > 0) && (
            <div className="flex justify-center mb-4">
              <Button
                variant="secondary"
                onClick={() => handleOpenSaveModal(questionMelody.length > 0 ? questionMelody : answerMelody)}
              >
                멜로디 저장
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleRetry} className="flex-1">
              다시 하기
            </Button>
            <Button onClick={handleExit} className="flex-1">
              나가기
            </Button>
          </div>
        </div>
      )}

      {/* 피아노 건반 */}
      <div className="mt-auto pt-4">
        <PianoKeyboard
          onNotePress={handleNotePress}
          disabled={!isKeyboardEnabled}
          instrument={instrument}
        />
      </div>

      {/* 저장 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="font-display text-xl text-primary mb-4">
              멜로디 저장
            </h2>

            {saveMessage ? (
              <div className="text-center py-4">
                <p className={`text-lg ${saveMessage.includes('실패') ? 'text-error' : 'text-success'}`}>
                  {saveMessage}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {/* 이름 입력 */}
                  <div>
                    <label className="block text-silver text-sm mb-2">
                      멜로디 이름
                    </label>
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="멜로디 이름을 입력하세요"
                      className="input-field w-full"
                      maxLength={30}
                      autoFocus
                    />
                  </div>

                  {/* 저장 위치 선택 */}
                  <div>
                    <label className="block text-silver text-sm mb-2">
                      저장 위치
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSaveTarget('file')}
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          saveTarget === 'file'
                            ? 'border-primary bg-primary/20 text-primary'
                            : 'border-surface-light text-silver hover:border-secondary'
                        }`}
                      >
                        파일로 저장
                        <p className="text-xs text-silver mt-1">.rthm 파일</p>
                      </button>
                      {Object.values(BGM_TYPES).map((bgmType) => (
                        <button
                          key={bgmType}
                          onClick={() => setSaveTarget(bgmType)}
                          className={`p-3 rounded-lg border text-sm transition-all ${
                            saveTarget === bgmType
                              ? 'border-secondary bg-secondary/20 text-secondary'
                              : 'border-surface-light text-silver hover:border-accent'
                          }`}
                        >
                          {bgmType} BGM
                          <p className="text-xs text-silver mt-1">바로 적용</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowSaveModal(false)}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!saveName.trim()}
                    onClick={handleSave}
                  >
                    저장
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SoloRoomPage;
