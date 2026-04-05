import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import { MatchProvider } from './context/MatchContext';

import HomePage from './pages/HomePage';
import TeamCreationPage from './pages/TeamCreationPage';
import TossPage from './pages/TossPage';
import LiveMatchPage from './pages/LiveMatchPage';
import SummaryPage from './pages/SummaryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MatchHistoryPage from './pages/MatchHistoryPage';
import AllPlayersPage from './pages/AllPlayersPage';

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <MatchProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1f2b42',
                color: '#f1f5f9',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9rem',
              }
            }}
          />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/team-setup/:matchCode" element={<TeamCreationPage />} />
            <Route path="/toss/:matchCode" element={<TossPage />} />
            <Route path="/live/:matchCode" element={<LiveMatchPage />} />
            <Route path="/summary/:matchCode" element={<SummaryPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/history" element={<MatchHistoryPage />} />
            <Route path="/players" element={<AllPlayersPage />} />
          </Routes>
        </MatchProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}
