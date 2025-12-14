# UI 디자인 가이드

## 테마
피아노, 오페라, 연주회 등 클래식 음악 콘서트 컨셉

## 컬러 팔레트

| 용도 | 색상 | HEX |
|------|------|-----|
| Primary | 골드 | #D4AF37 |
| Secondary | 딥 버건디 | #722F37 |
| Background | 다크 네이비 | #1A1A2E |
| Surface | 차콜 | #2D2D44 |
| Text Primary | 아이보리 | #FFFEF2 |
| Text Secondary | 실버 | #C0C0C0 |
| Accent | 로즈 골드 | #B76E79 |
| Success | 에메랄드 | #50C878 |
| Error | 코럴 레드 | #FF6B6B |

## 폰트

| 용도 | 폰트 | 비고 |
|------|------|------|
| 제목 | Playfair Display | 클래식한 세리프체 |
| 본문 | Noto Sans KR | 가독성 높은 한글 폰트 |
| 숫자/점수 | Montserrat | 모던한 숫자 표현 |

## 화면 구성

### 1. 닉네임 입력 화면
- 중앙 정렬 레이아웃
- 피아노 건반 배경 일러스트
- 골드 테두리 입력 필드
- "입장하기" 버튼

### 2. 대기방 화면
- 방 목록 카드 형태
- 각 방: 방 이름, 참가자 수, 입장 버튼
- 우측 하단: 방 생성 FAB 버튼
- 상단: 현재 닉네임 표시

### 3. 게임방 화면
- 상단: 라운드 정보, 타이머
- 중앙: 참가자 아바타 원형 배치
- 하단: 피아노 건반 UI
- 출제자 표시: 골드 왕관 아이콘

### 4. 피아노 건반 UI
- 1옥타브 + 흰 건반 8개, 검은 건반 5개
- 터치 영역 최적화 (모바일 기준 최소 44px)
- 누를 때 시각적 피드백 (색상 변화 + 미세 스케일)
- 건반 아래 음 이름 표시 옵션

### 5. 녹음/재생 UI
- 녹음 버튼: 빨간 원형, 펄스 애니메이션
- 재생 버튼: 삼각형 아이콘
- 진행 바: 골드 색상
- 남은 시간 카운트다운

### 6. 결과 화면
- 승자 중앙 하이라이트
- 컨페티 애니메이션
- 점수 비교 차트
- "다시 듣기" 버튼 (출제자/도전자 연주)

### 7. 최종 결과 화면
- 순위표 (1~6위)
- 1등: 트로피 아이콘 + 특별 애니메이션
- 각 플레이어 총 점수 표시
- "다시 하기" / "나가기" 버튼

## 컴포넌트 스타일

### 버튼
```css
/* Primary Button */
background: linear-gradient(135deg, #D4AF37, #B8960C);
border-radius: 8px;
padding: 12px 24px;
box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);

/* Secondary Button */
background: transparent;
border: 2px solid #D4AF37;
color: #D4AF37;
```

### 카드
```css
background: #2D2D44;
border-radius: 12px;
border: 1px solid rgba(212, 175, 55, 0.2);
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
```

### 입력 필드
```css
background: rgba(255, 255, 255, 0.05);
border: 1px solid #D4AF37;
border-radius: 8px;
color: #FFFEF2;
```

## 애니메이션

| 요소 | 애니메이션 | 지속시간 |
|------|------------|----------|
| 페이지 전환 | Fade + Slide | 300ms |
| 버튼 호버 | Scale 1.05 | 150ms |
| 건반 누름 | Scale 0.95 + 색상 | 100ms |
| 점수 증가 | Count Up | 500ms |
| 승자 발표 | Zoom In + Glow | 800ms |

## 반응형 기준

| 구분 | 너비 |
|------|------|
| Mobile (기본) | ~767px |
| Tablet | 768px~1023px |
| Desktop | 1024px~ |

## 접근성
- 최소 터치 영역: 44x44px
- 색상 대비율: WCAG AA 기준 충족
- 포커스 표시: 골드 아웃라인
