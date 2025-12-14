# 시스템 설계 문서

## 아키텍처 개요

```
[React Client] <--WebSocket--> [NestJS Server] <---> [Firebase Realtime DB]
     :3001                          :4000
```

## 프로젝트 구조

```
WebProejct_Rythme/
├── packages/
│   └── shared/                 # 공통 타입/상수
│       └── src/
│           ├── types/          # TypeScript 타입 정의
│           └── constants/      # 게임 설정 상수
├── apps/
│   ├── frontend/               # React 클라이언트
│   │   └── src/
│   │       ├── components/     # UI 컴포넌트
│   │       ├── pages/          # 페이지 컴포넌트
│   │       ├── hooks/          # 커스텀 훅
│   │       ├── stores/         # Zustand 스토어
│   │       ├── services/       # Socket 서비스
│   │       └── utils/          # 유틸리티 함수
│   └── backend/                # NestJS 서버
│       └── src/
│           ├── modules/        # 기능 모듈
│           │   ├── user/
│           │   ├── room/
│           │   └── game/
│           └── services/       # 공통 서비스
```

## Firebase Realtime Database 스키마

```typescript
{
  "users": {
    "[odId]": {
      "odId": string,
      "nickname": string,
      "createdAt": number
    }
  },

  "rooms": {
    "[roomId]": {
      "roomId": string,
      "name": string,
      "hostId": string,
      "status": "waiting" | "playing" | "finished",
      "maxPlayers": number,
      "currentRound": number,
      "totalRounds": number,   // 플레이어 수 × 3
      "createdAt": number,

      "players": {
        "[odId]": {
          "odId": string,
          "nickname": string,
          "score": number,
          "isAI": boolean,
          "isReady": boolean,
          "joinedAt": number
        }
      },

      "gameState": {
        "phase": "idle" | "recording" | "listening" | "challenging" | "judging" | "result",
        "questionerId": string,
        "questionerOrder": string[],
        "currentQuestionerIndex": number,
        "recordingEndTime": number | null,
        "challengeEndTime": number | null
      },

      "currentQuestion": {
        "questionerId": string,
        "notes": Note[],
        "recordedAt": number
      },

      "challenges": {
        "[odId]": {
          "odId": string,
          "notes": Note[],
          "submittedAt": number,
          "similarity": number
        }
      },

      "roundResults": {
        "[roundNumber]": {
          "round": number,
          "questionerId": string,
          "winnerId": string | null,
          "winnerSimilarity": number,
          "questionerScore": number,
          "winnerScore": number,
          "grade": "PERFECT" | "GREAT" | "GOOD" | "MISS",
          "questionNotes": Note[],
          "winnerNotes": Note[]
        }
      }
    }
  }
}
```

## 게임 상태 흐름

```
[waiting] --> [playing] --> [finished]
                 |
                 v
    +--------------------------------------------+
    |                                            |
    v                                            |
[idle] --> [recording] --> [listening] --> [challenging] --> [judging] --> [result]
    ^                                                                         |
    +-------------------------------------------------------------------------+
```

### 상태별 설명

| 상태 | 설명 | 지속시간 |
|------|------|----------|
| idle | 다음 출제자 대기 | 3초 |
| recording | 출제자 녹음 중 | 10초 |
| listening | 문제 재생 (모든 플레이어) | 5초 |
| challenging | 도전자들 녹음/연주 중 | 15초 |
| judging | 점수 계산 중 | 2초 |
| result | 결과 표시 | 8초 |

## 실시간 이벤트

### Client → Server

| 이벤트 | 페이로드 | 설명 |
|--------|----------|------|
| `room:create` | `{ name, maxPlayers }` | 방 생성 |
| `room:join` | `{ roomId }` | 방 입장 |
| `room:leave` | `{ roomId }` | 방 퇴장 |
| `room:ready` | `{ roomId, isReady }` | 준비 상태 변경 |
| `room:addAI` | `{ roomId, difficulty }` | AI 플레이어 추가 |
| `game:start` | `{ roomId }` | 게임 시작 (방장만) |
| `game:submitRecording` | `{ roomId, notes }` | 출제자 녹음 제출 |
| `game:submitChallenge` | `{ roomId, notes }` | 도전자 연주 제출 |

### Server → Client

| 이벤트 | 페이로드 | 설명 |
|--------|----------|------|
| `room:list` | `RoomSummary[]` | 방 목록 |
| `room:created` | `Room` | 방 생성 완료 |
| `room:updated` | `Room` | 방 정보 갱신 |
| `room:playerJoined` | `Player` | 플레이어 입장 |
| `room:playerLeft` | `{ odId }` | 플레이어 퇴장 |
| `game:phaseChanged` | `{ phase, questionerId?, endTime? }` | 게임 단계 변경 |
| `game:questionReady` | `{ notes }` | 녹음 완료 알림 |
| `game:playQuestion` | `{ notes }` | 문제 재생 시작 |
| `game:roundResult` | `RoundResult` | 라운드 결과 |
| `game:finalResult` | `FinalResult` | 최종 결과 |
| `error` | `{ code, message }` | 에러 발생 |

## 점수 계산 로직

### 유사도 계산

```typescript
interface Note {
  note: string;      // "C4", "D4", "E4" 등
  timestamp: number; // ms 단위
}

function calculateSimilarity(
  original: Note[],
  challenge: Note[]
): number {
  // 1. 음 순서 일치율 (50%)
  const noteSequenceScore = compareNoteSequence(original, challenge);

  // 2. 타이밍 일치율 (30%)
  const timingScore = compareTimings(original, challenge);

  // 3. 음 개수 일치율 (20%)
  const countScore = compareNoteCounts(original, challenge);

  return (noteSequenceScore * 0.5) +
         (timingScore * 0.3) +
         (countScore * 0.2);
}
```

### 점수 부여

| 조건 | 출제자 점수 | 도전자 점수 |
|------|-------------|-------------|
| 유사도 90% 이상 (PERFECT) | +100 | +100 |
| 유사도 70~89% (GREAT) | +70 | +70 |
| 유사도 50~69% (GOOD) | +50 | +50 |
| 유사도 50% 미만 (MISS) | +30 | +30 |
| 도전자 없음 | +20 | - |

## AI 플레이어 로직

### AI 서비스 (ai.service.ts)

```typescript
@Injectable()
export class AIService {
  // AI 플레이어 생성
  createAIPlayer(difficulty: AIDifficulty): Player;

  // AI 출제용 멜로디 생성 (간단한 패턴)
  generateMelody(): Note[];

  // AI 도전용 연주 생성 (의도적으로 낮은 유사도)
  generateLosingChallenge(original: Note[]): Note[];
}
```

### AI 행동 패턴

| 상황 | 행동 |
|------|------|
| AI가 출제자일 때 | 1초 후 간단한 멜로디 자동 생성 |
| AI가 도전자일 때 | 2~7초 랜덤 딜레이 후 30~50% 유사도 연주 제출 |

## 주요 타입 정의

### 공유 타입 (packages/shared)

```typescript
// types/game.ts
export type GamePhase = 'idle' | 'recording' | 'listening' | 'challenging' | 'judging' | 'result';
export type ScoreGrade = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export interface Note {
  note: string;
  timestamp: number;
}

export interface RoundResult {
  round: number;
  questionerId: string;
  winnerId: string | null;
  winnerSimilarity: number;
  questionerScore: number;
  winnerScore: number;
  grade: ScoreGrade;
  questionNotes: Note[];
  winnerNotes: Note[];
}

// constants/game.ts
export const GAME_CONFIG = {
  MAX_PLAYERS: 6,
  MIN_PLAYERS: 1,
  RECORDING_TIME_MS: 10000,
  LISTENING_TIME_MS: 5000,
  CHALLENGE_TIME_MS: 15000,
  IDLE_TIME_MS: 3000,
  JUDGING_TIME_MS: 2000,
  RESULT_TIME_MS: 8000,
  TOTAL_ROUNDS: 3,
} as const;

export const calculateTotalTurns = (playerCount: number): number => {
  return playerCount * GAME_CONFIG.TOTAL_ROUNDS;
};
```

## 피아노 음역 정의

```typescript
const PIANO_NOTES = [
  'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4',
  'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'
] as const;

const WHITE_KEYS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
const BLACK_KEYS = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4'];

const NOTE_FREQUENCIES: Record<string, number> = {
  'C4': 261.63,
  'C#4': 277.18,
  'D4': 293.66,
  // ...
};
```

## 오디오 시스템

### Web Audio API 사용

```typescript
// utils/audioUtils.ts

// 단일 음 재생
export const playNote = (note: string, duration: number = 0.3): void;

// 멜로디 재생 (타임스탬프 기반)
export const playMelody = (
  notes: NoteWithTimestamp[],
  onComplete?: () => void
): (() => void);  // 정지 함수 반환

// AudioContext 재개 (사용자 인터랙션 필요)
export const resumeAudioContext = async (): Promise<void>;
```

## 상태 관리 (Zustand)

### 스토어 구조

```typescript
// stores/useUserStore.ts
interface UserState {
  odId: string | null;
  nickname: string | null;
  setUser: (odId: string, nickname: string) => void;
}

// stores/useRoomStore.ts
interface RoomState {
  rooms: RoomSummary[];
  currentRoom: Room | null;
  setRooms: (rooms: RoomSummary[]) => void;
  setCurrentRoom: (room: Room | null) => void;
  updateRoom: (room: Room) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (odId: string) => void;
}

// stores/useGameStore.ts
interface GameState {
  phase: GamePhase;
  questionerId: string | null;
  questionNotes: Note[];
  recordedNotes: Note[];
  challengeNotes: Note[];
  roundResult: RoundResult | null;
  finalResult: FinalResult | null;
  endTime: number | null;
  isRecording: boolean;
  // ... actions
}
```

## 에러 처리

| 에러 코드 | 설명 |
|-----------|------|
| `ROOM_NOT_FOUND` | 존재하지 않는 방 |
| `ROOM_FULL` | 방 정원 초과 |
| `NOT_HOST` | 방장 권한 필요 |
| `JOIN_FAILED` | 방 입장 실패 |
| `GAME_ALREADY_STARTED` | 이미 시작된 게임 |
| `NOT_YOUR_TURN` | 출제 순서 아님 |
| `INVALID_PHASE` | 잘못된 게임 단계 |

## 보안 고려사항

- 클라이언트 ID(odId)는 UUID로 생성하여 로컬스토리지에 저장
- 방장 권한 액션 검증 (게임 시작, AI 추가 등)
- 게임 중 연결 해제 시 자동 퇴장 처리
- 방에 사람 플레이어가 없으면 자동 삭제
