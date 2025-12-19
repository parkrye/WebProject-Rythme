# UI 디자인 가이드

## 테마
**Synthwave / Retrowave** - 네온 사인, 신디사이저, 심야 클럽, 도시의 밤거리 컨셉

## 컬러 팔레트

| 용도 | 색상 | HEX |
|------|------|-----|
| Primary | 네온 핑크 | #FF2E97 |
| Secondary | 네온 시안 | #00F5FF |
| Accent | 네온 퍼플 | #9D4EDD |
| Background | 딥 네이비 | #0A0A1A |
| Surface | 다크 퍼플 | #1A1028 |
| Surface Light | 미드나잇 블루 | #252040 |
| Text Primary | 화이트 | #FFFFFF |
| Text Secondary | 라이트 퍼플 | #B8B8D0 |
| Success | 네온 그린 | #39FF14 |
| Warning | 네온 옐로우 | #FFFF00 |
| Error | 핫 핑크 | #FF1744 |

## 그라데이션

```css
/* Primary Gradient - 메인 버튼, 강조 요소 */
background: linear-gradient(135deg, #FF2E97, #9D4EDD);

/* Synthwave Sunset - 배경 장식 */
background: linear-gradient(180deg, #FF2E97 0%, #9D4EDD 50%, #00F5FF 100%);

/* Neon Glow - 테두리, 효과 */
background: linear-gradient(90deg, #00F5FF, #FF2E97);
```

## 폰트

| 용도 | 폰트 | 비고 |
|------|------|------|
| 제목 | Orbitron | 미래지향적 기하학 폰트 |
| 본문 | Noto Sans KR | 가독성 높은 한글 폰트 |
| 숫자/점수 | Audiowide | 디지털/레트로 느낌 |
| 액센트 | Rajdhani | 사이버펑크 느낌 |

## 네온 효과

```css
/* 네온 글로우 텍스트 */
.neon-text {
  color: #FF2E97;
  text-shadow:
    0 0 5px #FF2E97,
    0 0 10px #FF2E97,
    0 0 20px #FF2E97,
    0 0 40px #FF2E97;
}

/* 네온 박스 글로우 */
.neon-box {
  box-shadow:
    0 0 5px #00F5FF,
    0 0 10px #00F5FF,
    0 0 20px #00F5FF,
    inset 0 0 10px rgba(0, 245, 255, 0.1);
  border: 1px solid #00F5FF;
}

/* 펄스 애니메이션 */
@keyframes neon-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

## 화면 구성

### 1. 닉네임 입력 화면
- 중앙 정렬 레이아웃
- 어두운 도시 실루엣 배경 + 네온 사인 장식
- 네온 글로우 테두리 입력 필드
- "입장하기" 버튼 (네온 핑크 그라데이션)
- 상단 로고: 네온 사인 스타일

### 2. 대기방 화면
- 방 목록 카드 형태 (글래스모피즘 + 네온 테두리)
- 각 방: 방 이름, 참가자 수, 입장 버튼
- 우측 하단: 방 생성 FAB 버튼 (네온 퍼플 글로우)
- 상단: 현재 닉네임 표시
- 배경: 격자 그리드 패턴 (retrowave 스타일)

### 3. 게임방 화면
- 상단: 라운드 정보, 타이머 (디지털 LED 스타일)
- 중앙: 참가자 아바타 원형 배치 (네온 링 효과)
- 하단: 신디사이저 스타일 건반 UI
- 출제자 표시: 네온 핑크 별 아이콘 + 글로우

### 4. 피아노 건반 UI
- 1옥타브 + 흰 건반 8개, 검은 건반 5개
- 신디사이저 스타일 디자인
- 터치 영역 최적화 (모바일 기준 최소 44px)
- 누를 때: 네온 글로우 + 색상 변화
- 건반 색상: 어두운 퍼플 베이스 + 네온 테두리

### 5. 녹음/재생 UI
- 녹음 버튼: 네온 핑크 원형, 펄스 글로우 애니메이션
- 재생 버튼: 시안 삼각형 아이콘 + 글로우
- 진행 바: 그라데이션 (핑크 → 퍼플 → 시안)
- 남은 시간 카운트다운 (LED 디지털 폰트)

### 6. 결과 화면
- 승자 중앙 하이라이트 (네온 스포트라이트)
- 파티클 애니메이션 (네온 색상)
- 점수 비교 차트 (네온 바 그래프)
- "다시 듣기" 버튼 (시안 글로우)

### 7. 최종 결과 화면
- 순위표 (1~6위)
- 1등: 네온 왕관 + 글로우 애니메이션
- 각 플레이어 총 점수 표시
- 배경: 레트로 그리드 + 산/태양 synthwave 배경
- "다시 하기" / "나가기" 버튼

## 컴포넌트 스타일

### 버튼
```css
/* Primary Button */
background: linear-gradient(135deg, #FF2E97, #9D4EDD);
border-radius: 8px;
padding: 12px 24px;
box-shadow:
  0 0 10px rgba(255, 46, 151, 0.5),
  0 4px 15px rgba(0, 0, 0, 0.3);
border: none;
color: #FFFFFF;
font-family: 'Orbitron', sans-serif;
text-transform: uppercase;
letter-spacing: 2px;

/* Primary Button Hover */
box-shadow:
  0 0 20px rgba(255, 46, 151, 0.8),
  0 0 40px rgba(157, 78, 221, 0.4);

/* Secondary Button */
background: transparent;
border: 2px solid #00F5FF;
color: #00F5FF;
box-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
```

### 카드
```css
background: rgba(26, 16, 40, 0.8);
backdrop-filter: blur(10px);
border-radius: 12px;
border: 1px solid rgba(0, 245, 255, 0.3);
box-shadow:
  0 0 20px rgba(0, 245, 255, 0.1),
  0 8px 32px rgba(0, 0, 0, 0.4);
```

### 입력 필드
```css
background: rgba(10, 10, 26, 0.8);
border: 2px solid #9D4EDD;
border-radius: 8px;
color: #FFFFFF;
box-shadow: 0 0 10px rgba(157, 78, 221, 0.2);

/* Focus */
border-color: #FF2E97;
box-shadow: 0 0 20px rgba(255, 46, 151, 0.4);
```

### 피아노 건반
```css
/* 흰 건반 */
.white-key {
  background: linear-gradient(180deg, #252040 0%, #1A1028 100%);
  border: 1px solid rgba(0, 245, 255, 0.3);
  border-radius: 0 0 8px 8px;
}

.white-key:active {
  background: linear-gradient(180deg, #9D4EDD 0%, #FF2E97 100%);
  box-shadow: 0 0 20px rgba(255, 46, 151, 0.6);
}

/* 검은 건반 */
.black-key {
  background: linear-gradient(180deg, #0A0A1A 0%, #1A1028 100%);
  border: 1px solid rgba(255, 46, 151, 0.3);
}

.black-key:active {
  background: #FF2E97;
  box-shadow: 0 0 15px rgba(255, 46, 151, 0.8);
}
```

## 애니메이션

| 요소 | 애니메이션 | 지속시간 |
|------|------------|----------|
| 페이지 전환 | Fade + Slide | 300ms |
| 버튼 호버 | Scale 1.05 + Glow 강화 | 200ms |
| 건반 누름 | Scale 0.95 + 네온 글로우 | 100ms |
| 점수 증가 | Count Up + 글로우 펄스 | 500ms |
| 승자 발표 | Zoom In + 네온 스파클 | 800ms |
| 네온 사인 | 깜빡임 (flicker) | 랜덤 |
| 배경 그리드 | 천천히 스크롤 | 무한 |

## 배경 요소

### Retrowave 그리드
```css
.retro-grid {
  background-image:
    linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  perspective: 500px;
  transform: rotateX(60deg);
}
```

### 도시 실루엣
```css
.city-silhouette {
  background: linear-gradient(180deg, transparent 0%, #0A0A1A 100%);
  /* 건물 실루엣 SVG 또는 이미지 */
  filter: drop-shadow(0 0 10px rgba(255, 46, 151, 0.5));
}
```

## 반응형 기준

| 구분 | 너비 |
|------|------|
| Mobile (기본) | ~767px |
| Tablet | 768px~1023px |
| Desktop | 1024px~ |

## 접근성
- 최소 터치 영역: 44x44px
- 색상 대비율: WCAG AA 기준 충족 (네온 색상은 어두운 배경과 대비)
- 포커스 표시: 네온 시안 아웃라인 + 글로우
- 깜빡임 효과: 초당 3회 미만 (광과민성 발작 방지)
