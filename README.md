# 리듬 퍼즐 게임

## 멀티 네트워크 테스트 URL

| 환경 | URL |
|------|-----|
| **게임 접속** | https://webproject-parkrye-rythme-game.onrender.com |

> 다른 기기나 네트워크에서 위 URL로 접속하면 같은 방에서 함께 플레이할 수 있습니다.
> Firebase Realtime Database를 통해 실시간 동기화됩니다.

---

네트워크 웹 기반 멀티플레이어 리듬 퍼즐 게임입니다.
출제자가 피아노로 멜로디를 연주하면, 다른 플레이어들이 해당 멜로디를 듣고 따라 연주하여 가장 비슷하게 연주한 사람이 점수를 획득합니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | NestJS (REST API) |
| Database | Firebase Realtime Database |
| Realtime | Firebase Realtime Database |
| Language | TypeScript |
| Package Manager | pnpm (Monorepo) |

---

## 프로젝트 구조

```
WebProejct_Rythme/
├── packages/
│   └── shared/                 # 공통 타입/상수
│       └── src/
│           ├── types/          # TypeScript 타입 정의
│           └── constants/      # 게임 설정 상수
├── apps/
│   ├── frontend/               # React 클라이언트 (:3001)
│   │   └── src/
│   │       ├── components/     # UI 컴포넌트
│   │       ├── pages/          # 페이지 컴포넌트
│   │       ├── hooks/          # 커스텀 훅
│   │       ├── stores/         # Zustand 스토어
│   │       └── utils/          # 유틸리티 함수
│   └── backend/                # NestJS 서버 (:4000)
│       └── src/
│           ├── modules/        # 기능 모듈
│           └── services/       # 공통 서비스
└── .claude/                    # 프로젝트 문서
```

---

## 설치 및 실행

### 1. 의존성 설치

```bash
pnpm install
```

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Realtime Database 활성화
3. 서비스 계정 키 다운로드
4. `apps/backend/` 디렉토리에 `serviceAccountKey.json` 파일 생성

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

5. `apps/backend/src/services/firebase.service.ts`에서 databaseURL 설정

### 3. 서버 실행

```bash
# 공통 패키지 빌드
pnpm --filter @rhythm-game/shared build

# 백엔드 서버 실행 (포트 4000)
pnpm dev:backend

# 프론트엔드 서버 실행 (포트 3001)
pnpm dev:frontend
```

### 4. 접속

브라우저에서 `http://localhost:3001` 접속

---

## 게임 방법

### 기본 흐름

1. **닉네임 입력** - 게임에 사용할 닉네임 설정
2. **로비** - 방 생성 또는 기존 방 입장
3. **게임** - 3라운드 동안 번갈아가며 출제/도전

### 게임 진행

```
대기(3초) → 녹음(10초) → 듣기(5초) → 도전(15초) → 판정(2초) → 결과(8초)
```

1. **대기**: 출제자가 선정됩니다
2. **녹음**: 출제자가 피아노로 멜로디를 연주합니다
3. **듣기**: 모든 플레이어가 출제자의 멜로디를 듣습니다
4. **도전**: 출제자를 제외한 플레이어들이 멜로디를 따라 연주합니다
5. **판정**: 서버에서 유사도를 계산합니다
6. **결과**: 승자와 점수가 발표됩니다

### 점수 시스템

| 유사도 | 등급 | 점수 |
|--------|------|------|
| 90% 이상 | PERFECT | +100 |
| 70~89% | GREAT | +70 |
| 50~69% | GOOD | +50 |
| 50% 미만 | MISS | +30 |

### AI 플레이어

- 방장만 추가 가능 (대기 중에만)
- 항상 준비 완료 상태
- 의도적으로 낮은 점수로 플레이 (30~50% 유사도)

---

## 개발자 가이드

### 코딩 컨벤션

- **하드코딩 금지**: 상수는 별도 파일로 분리
- **SOLID 원칙 준수**: 단일 책임 원칙
- **Early Return 패턴**: 중첩 최소화
- **파일 500줄 제한**: 초과 시 분리

### 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `PianoKeyboard.tsx` |
| 함수/변수 | camelCase | `calculateScore()` |
| 상수 | UPPER_SNAKE_CASE | `MAX_PLAYERS` |
| Boolean | is/has/can 접두사 | `isPlaying` |

### 주요 문서

| 문서 | 경로 | 설명 |
|------|------|------|
| CLAUDE.md | `.claude/CLAUDE.md` | 개발 가이드 |
| GAMERULE.md | `.claude/GAMERULE.md` | 게임 규칙 |
| UIDESIGN.md | `.claude/UIDESIGN.md` | UI/UX 디자인 |
| SYSTEMDESIGN.md | `.claude/SYSTEMDESIGN.md` | 시스템 아키텍처 |

---

## 커밋 메시지 규칙

```
<type>: <subject>
```

| Type | 설명 |
|------|------|
| feat | 새로운 기능 |
| fix | 버그 수정 |
| refactor | 리팩토링 |
| style | 코드 스타일 |
| docs | 문서 수정 |
| test | 테스트 코드 |
| chore | 빌드, 설정 변경 |

예시: `feat: 피아노 건반 컴포넌트 구현`

---

## 라이선스

MIT License
