import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPlayers } from '../services/api';
import './AllPlayersPage.css';

export default function AllPlayersPage() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const res = await getAllPlayers();
      setPlayers(res.data.players);
    } catch (err) {
      console.error('Failed to load players', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="players-page">
        <div className="container loading-state">
          <div className="loading-spinner" />
          <p>Loading Player Profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="players-page">
      <div className="container">
        <div className="players-header animate-fade-in">
          <span className="players-icon">👤</span>
          <h1 className="page-title">Player Profiles</h1>
          <p className="page-subtitle">Detailed career statistics for all players</p>
        </div>

        {players.length === 0 ? (
          <div className="empty-state glass-card animate-slide-up">
            <span className="empty-icon">📂</span>
            <h3>No Players Found</h3>
            <p>Start playing matches to see player statistics here.</p>
          </div>
        ) : (
          <div className="table-responsive glass-card animate-slide-up">
            <table className="players-table">
              <thead>
                <tr>
                  <th className="sticky-col">Player</th>
                  <th>Mat</th>
                  <th>Runs</th>
                  <th>HS</th>
                  <th>Avg</th>
                  <th>SR</th>
                  <th>50s</th>
                  <th>100s</th>
                  <th>4s</th>
                  <th>6s</th>
                  <th>Wkts</th>
                  <th>BBI</th>
                  <th>Econ</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p._id}>
                    <td className="sticky-col player-name-cell">{p.name}</td>
                    <td>{p.matchesPlayed}</td>
                    <td className="highlight-stat">{p.batting.totalRuns}</td>
                    <td>{p.batting.highestScore}</td>
                    <td>{p.battingAverage}</td>
                    <td>{p.strikeRate}</td>
                    <td>{p.batting.fifties || 0}</td>
                    <td>{p.batting.hundreds || 0}</td>
                    <td>{p.batting.fours}</td>
                    <td>{p.batting.sixes}</td>
                    <td className="highlight-stat-alt">{p.bowling.wickets}</td>
                    <td>{p.bowling.bestBowling.wickets}/{p.bowling.bestBowling.runs}</td>
                    <td>{p.economyRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button className="btn-secondary back-btn" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
