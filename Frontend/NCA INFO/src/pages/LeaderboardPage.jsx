import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../services/api';
import './LeaderboardPage.css';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('runs'); // runs, wickets, score, sr

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getLeaderboard();
      setData(res.data.leaderboards);
    } catch (err) {
      console.error('Failed to load leaderboards', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="container loading-state">
          <div className="loading-spinner" />
          <p>Loading records...</p>
        </div>
      </div>
    );
  }

  const renderTable = (players, type) => {
    if (!players || players.length === 0) {
      return (
        <div className="empty-state glass-card animate-slide-up">
          <span className="empty-icon">📭</span>
          <h3>No Stats Found</h3>
          <p>Play and complete matches to build your player records!</p>
        </div>
      );
    }

    return (
      <div className="table-wrapper glass-card animate-slide-up">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="rank-col">#</th>
              <th className="name-col">Player</th>
              <th>Mat</th>
              {type === 'runs' && <th>Runs</th>}
              {type === 'runs' && <th>Avg</th>}
              {type === 'wickets' && <th>Wkts</th>}
              {type === 'wickets' && <th>Econ</th>}
              {type === 'score' && <th>Score</th>}
              {type === 'sr' && <th>SR</th>}
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p._id}>
                <td className="rank-col">{i + 1}</td>
                <td className="name-col">{p.name}</td>
                <td>{p.matchesPlayed}</td>
                {type === 'runs' && <td className="highlight-stat">{p.batting.totalRuns}</td>}
                {type === 'runs' && <td>{p.battingAverage}</td>}
                {type === 'wickets' && <td className="highlight-stat">{p.bowling.wickets}</td>}
                {type === 'wickets' && <td>{p.economyRate}</td>}
                {type === 'score' && <td className="highlight-stat">{p.batting.highestScore}</td>}
                {type === 'sr' && <td className="highlight-stat">{p.strikeRate}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="leaderboard-page">
      <div className="container">
        <div className="leaderboard-header animate-fade-in">
          <span className="trophy-icon">📊</span>
          <h1 className="page-title">Players Stats</h1>
          <p className="page-subtitle">All-time player statistics</p>
        </div>

        <div className="lb-tabs animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <button 
            className={`lb-tab ${activeTab === 'runs' ? 'active' : ''}`} 
            onClick={() => setActiveTab('runs')}
          >
            Most Runs
          </button>
          <button 
            className={`lb-tab ${activeTab === 'wickets' ? 'active' : ''}`} 
            onClick={() => setActiveTab('wickets')}
          >
            Most Wickets
          </button>
          <button 
            className={`lb-tab ${activeTab === 'score' ? 'active' : ''}`} 
            onClick={() => setActiveTab('score')}
          >
            High Scores
          </button>
          <button 
            className={`lb-tab ${activeTab === 'sr' ? 'active' : ''}`} 
            onClick={() => setActiveTab('sr')}
          >
            Best SR
          </button>
        </div>

        {!data ? (
          <div className="empty-state glass-card animate-slide-up">
            <span className="empty-icon">📭</span>
            <h3>No Records Available</h3>
            <p>Complete a match to generate player statistics.</p>
          </div>
        ) : (
          <>
            {activeTab === 'runs' && renderTable(data.mostRuns, 'runs')}
            {activeTab === 'wickets' && renderTable(data.mostWickets, 'wickets')}
            {activeTab === 'score' && renderTable(data.highestScore, 'score')}
            {activeTab === 'sr' && renderTable(data.highestStrikeRate, 'sr')}
          </>
        )}

        <button className="btn-secondary back-btn" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
