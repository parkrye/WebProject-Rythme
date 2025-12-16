import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NicknamePage from './pages/NicknamePage';
import LobbyPage from './pages/LobbyPage';
import GameRoomPage from './pages/GameRoomPage';
import SoloRoomPage from './pages/SoloRoomPage';
import { useUserStore } from './stores/useUserStore';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const nickname = useUserStore((state) => state.nickname);

  if (!nickname) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
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
