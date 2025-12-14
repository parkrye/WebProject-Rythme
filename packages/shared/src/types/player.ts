export interface Player {
  odId: string;
  nickname: string;
  score: number;
  isAI: boolean;
  isReady: boolean;
  joinedAt: number;
}

export interface User {
  odId: string;
  nickname: string;
  createdAt: number;
}
