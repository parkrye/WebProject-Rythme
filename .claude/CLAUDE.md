# 프로젝트 개발 가이드

## 프로젝트 개요
네트워크 웹 리듬 퍼즐 게임 - 피아노 멜로디 따라하기

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Frontend | React | 18.x |
| Styling | Tailwind CSS | 3.x |
| Backend | NestJS | 10.x |
| Database | Firebase Realtime Database | - |
| Language | TypeScript | 5.x |
| 실시간 통신 | Socket.io | 4.x |

## 주요 플레이 환경
- **타겟**: 모바일 웹 (터치 기반)
- **지원 브라우저**: Chrome, Safari (모바일)
- **최소 화면**: 360px 너비

---

## 코딩 컨벤션

### 필수 규칙
- 하드코딩 금지 (상수는 별도 파일로 분리)
- SOLID 원칙 준수
- 단일 책임 원칙 (하나의 클래스/함수는 하나의 역할만)
- Early Return 패턴 사용 (중첩 최소화)
- 파일당 500줄 초과 금지 (초과 시 분리)

### 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `PianoKeyboard.tsx` |
| 함수/변수 | camelCase | `calculateScore()` |
| 상수 | UPPER_SNAKE_CASE | `MAX_PLAYERS` |
| 타입/인터페이스 | PascalCase | `interface Player {}` |
| 이벤트 핸들러 | handle + 동사 | `handleNotePress()` |
| Boolean | is/has/can 접두사 | `isPlaying`, `hasSubmitted` |

### TypeScript 규칙
```typescript
// any 사용 금지 - 명시적 타입 정의
// Bad
const data: any = response;

// Good
interface ApiResponse {
  success: boolean;
  data: Player[];
}
const data: ApiResponse = response;
```

```typescript
// 인터페이스는 I 접두사 사용하지 않음
// Bad
interface IPlayer {}

// Good
interface Player {}
```

### React 컴포넌트 규칙
```typescript
// 함수형 컴포넌트 + 화살표 함수
// Props 타입은 컴포넌트명 + Props
interface PianoKeyProps {
  note: string;
  onPress: (note: string) => void;
}

const PianoKey: React.FC<PianoKeyProps> = ({ note, onPress }) => {
  // Early Return 패턴
  if (!note) return null;

  const handlePress = () => {
    onPress(note);
  };

  return (
    <button onClick={handlePress}>
      {note}
    </button>
  );
};

export default PianoKey;
```

### 폴더 구조 (Frontend)
```
src/
├── components/       # 재사용 가능한 UI 컴포넌트
│   ├── common/       # 공통 컴포넌트 (Button, Input 등)
│   └── game/         # 게임 관련 컴포넌트
├── pages/            # 페이지 컴포넌트
├── hooks/            # 커스텀 훅
├── services/         # API, Socket 통신
├── stores/           # 상태 관리
├── types/            # TypeScript 타입 정의
├── constants/        # 상수 정의
└── utils/            # 유틸리티 함수
```

### 폴더 구조 (Backend - NestJS)
```
src/
├── modules/
│   ├── user/         # 사용자 모듈
│   ├── room/         # 방 모듈
│   └── game/         # 게임 모듈
├── gateways/         # WebSocket 게이트웨이
├── services/         # 비즈니스 로직
├── dto/              # Data Transfer Objects
├── interfaces/       # 인터페이스 정의
└── constants/        # 상수 정의
```

### 상수 분리 예시
```typescript
// constants/game.ts
export const GAME_CONFIG = {
  MAX_PLAYERS: 6,
  MIN_PLAYERS: 1,
  RECORDING_TIME_MS: 10000,
  CHALLENGE_TIME_MS: 15000,
  RESULT_DISPLAY_TIME_MS: 5000,
} as const;

export const SCORE_TABLE = {
  PERFECT: 100,    // 90% 이상
  GREAT: 70,       // 70~89%
  GOOD: 50,        // 50~69%
  MISS: 30,        // 50% 미만
} as const;
```

### 에러 처리 패턴
```typescript
// 커스텀 에러 클래스 사용
class GameError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}

// 사용
throw new GameError('ROOM_FULL', '방이 가득 찼습니다');
```

---

## 문서 참조

| 문서 | 경로 | 설명 |
|------|------|------|
| CLAUDE | `.claude/CLAUDE.md` | AI 에이전트 규칙 (현재 문서) |
| GAMERULE | `.claude/GAMERULE.md` | 게임 규칙 상세 |
| UIDESIGN | `.claude/UIDESIGN.md` | UI/UX 디자인 가이드 |
| SYSTEMDESIGN | `.claude/SYSTEMDESIGN.md` | 시스템 아키텍처 설계 |
| README | `README.md` | 설치/실행 가이드 |

---

## 커밋 메시지 규칙

```
<type>: <subject>

[body]
```

| Type | 설명 |
|------|------|
| feat | 새로운 기능 |
| fix | 버그 수정 |
| refactor | 리팩토링 |
| style | 코드 스타일 (포맷팅) |
| docs | 문서 수정 |
| test | 테스트 코드 |
| chore | 빌드, 설정 변경 |

예시: `feat: 피아노 건반 컴포넌트 구현`
