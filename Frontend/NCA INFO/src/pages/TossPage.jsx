import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMatch, saveToss } from '../services/api';
import { useMatch } from '../context/MatchContext';
import toast from 'react-hot-toast';
import './TossPage.css';

export default function TossPage() {
  const { matchCode } = useParams();
  const navigate = useNavigate();
  const { registerHost, match: contextMatch } = useMatch();

  const [teams, setTeams] = useState([]);
  const [tossWinner, setTossWinner] = useState(-1);
  const [decision, setDecision] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    loadMatch();
  }, []);

  const loadMatch = async () => {
    try {
      const res = await getMatch(matchCode);
      setTeams(res.data.match.teams);
    } catch (err) {
      toast.error('Failed to load match');
    }
  };

  const handleCoinFlip = () => {
    setIsFlipping(true);
    setTossWinner(-1);
    // Simulate coin flip animation
    setTimeout(() => {
      const winner = Math.random() < 0.5 ? 0 : 1;
      setTossWinner(winner);
      setIsFlipping(false);
      toast.success(`${teams[winner]?.name} won the toss!`);
    }, 1500);
  };

  const handleProceed = async () => {
    if (tossWinner === -1 || !decision) {
      toast.error('Complete the toss first');
      return;
    }

    setIsSaving(true);
    try {
      await saveToss(matchCode, tossWinner, decision);
      registerHost(matchCode);
      toast.success('Toss saved! Starting match...');
      navigate(`/live/${matchCode}`);
    } catch (err) {
      toast.error('Failed to save toss');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="toss-page">
      <div className="container">
        <div className="toss-header animate-fade-in">
          <span className="match-code-badge">{matchCode}</span>
          <h1 className="page-title">The Toss</h1>
          <p className="page-subtitle">Decide who bats first</p>
        </div>

        {/* Coin Flip */}
        <div className="toss-coin-section glass-card animate-slide-up">
          <div className={`coin ${isFlipping ? 'flipping' : ''}`} onClick={handleCoinFlip}>
            <div className="coin-face">
              {tossWinner === -1 ? '🪙' : '🏏'}
            </div>
          </div>
          <button className="btn-secondary flip-btn" onClick={handleCoinFlip} disabled={isFlipping}>
            {isFlipping ? 'Flipping...' : tossWinner === -1 ? 'Flip Coin' : 'Flip Again'}
          </button>
        </div>

        {/* Toss Winner Selection */}
        <div className="toss-section glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="section-title">Toss Won By</h3>
          <div className="toss-options">
            {teams.map((team, i) => (
              <button
                key={i}
                className={`toss-option ${tossWinner === i ? 'selected' : ''}`}
                onClick={() => setTossWinner(i)}
              >
                <span className="option-icon">{tossWinner === i ? '🏆' : '🏏'}</span>
                <span className="option-label">{team.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Decision */}
        {tossWinner !== -1 && (
          <div className="toss-section glass-card animate-slide-up">
            <h3 className="section-title">
              {teams[tossWinner]?.name} chose to
            </h3>
            <div className="toss-options">
              <button
                className={`toss-option ${decision === 'bat' ? 'selected bat' : ''}`}
                onClick={() => setDecision('bat')}
              >
                <span className="option-icon">🏏</span>
                <span className="option-label">Bat</span>
              </button>
              <button
                className={`toss-option ${decision === 'bowl' ? 'selected bowl' : ''}`}
                onClick={() => setDecision('bowl')}
              >
                <span className="option-icon">⚾</span>
                <span className="option-label">Bowl</span>
              </button>
            </div>
          </div>
        )}

        {/* Summary & Proceed */}
        {tossWinner !== -1 && decision && (
          <div className="toss-summary animate-slide-up">
            <div className="summary-text">
              <strong>{teams[tossWinner]?.name}</strong> won the toss and chose to <strong>{decision}</strong>
            </div>
            <button
              className="btn-primary proceed-btn"
              onClick={handleProceed}
              disabled={isSaving}
            >
              {isSaving ? 'Starting...' : 'Start Match →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
