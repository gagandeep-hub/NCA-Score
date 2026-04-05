import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMatchHistory } from '../services/api';
import './MatchHistoryPage.css';

export default function MatchHistoryPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await getMatchHistory();
      setMatches(res.data.matches);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="container loading-state">
          <div className="loading-spinner" />
          <p>Loading Match History...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="container">
        <div className="history-header animate-fade-in">
          <span className="history-icon">📚</span>
          <h1 className="page-title">Match History</h1>
          <p className="page-subtitle">Past Completed Matches</p>
        </div>

        {matches.length === 0 ? (
          <div className="empty-state glass-card animate-slide-up">
            <span className="empty-icon">📂</span>
            <h3>No History Available</h3>
            <p>Once a match is completely finished, it will permanently appear here.</p>
          </div>
        ) : (
          <div className="history-list animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {matches.map((match) => {
              const teamA = match.teams[0]?.name || 'Team A';
              const teamB = match.teams[1]?.name || 'Team B';
              const in1 = match.innings[0];
              const in2 = match.innings[1];

              return (
                <div key={match._id} className="history-card glass-card">
                  <div className="history-card-header">
                    <span className="match-date">{formatDate(match.updatedAt)}</span>
                    <span className="match-code">#{match.matchCode}</span>
                  </div>
                  
                  <div className="history-teams">
                    <div className="history-team">
                      <h5>{teamA}</h5>
                      <span className="history-score">
                        {in1 ? `${in1.totalRuns}/${in1.totalWickets}` : '0/0'}
                        <small> ({in1 ? Math.floor(in1.totalBalls / 6) + '.' + (in1.totalBalls % 6) : '0.0'} ov)</small>
                      </span>
                    </div>
                    <div className="history-vs">VS</div>
                    <div className="history-team">
                      <h5>{teamB}</h5>
                      <span className="history-score">
                        {in2 ? `${in2.totalRuns}/${in2.totalWickets}` : '0/0'}
                        <small> ({in2 ? Math.floor(in2.totalBalls / 6) + '.' + (in2.totalBalls % 6) : '0.0'} ov)</small>
                      </span>
                    </div>
                  </div>

                  <div className="history-result">
                    {match.result || "Match Completed"}
                  </div>
                  
                  <button 
                    className="btn-ghost view-summary-btn"
                    onClick={() => navigate(`/summary/${match.matchCode}`)}
                  >
                    View Scorecard →
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <button className="btn-secondary back-btn animate-fade-in" style={{animationDelay: '0.3s'}} onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
