import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NicknamePage from './pages/NicknamePage';
import LobbyPage from './pages/LobbyPage';
import GameRoomPage from './pages/GameRoomPage';
import SoloRoomPage from './pages/SoloRoomPage';
import { useUserStore } from './stores/useUserStore';
import { initializeFirebase } from './config/firebase';
import { useVersionCheck } from './hooks/useVersionCheck';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const nickname = useUserStore((state) => state.nickname);

  if (!nickname) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  // 버전 체크 - 새 빌드 감지 시 자동 새로고침
  useVersionCheck();

  useEffect(() => {
    // Firebase 초기화
    initializeFirebase();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-full bg-background">
        <Routes>
          <Route path="/" element={<NicknamePage />} />
          <Route
            path="/lobby"
            element={
              <ProtectedRoute>
                <LobbyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute>
                <GameRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/solo"
            element={
              <ProtectedRoute>
                <SoloRoomPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
