import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMatch } from '../services/api';
import { useMatch } from '../context/MatchContext';
import toast from 'react-hot-toast';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { joinMatch, registerHost } = useMatch();
  const [joinCode, setJoinCode] = useState('');
  const [totalOvers, setTotalOvers] = useState(20);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  const handleCreateMatch = async () => {
    const overs = parseInt(totalOvers);
    if (!overs || overs < 1) {
      toast.error('Enter a valid number of overs (min 1)');
      return;
    }

    setIsCreating(true);
    try {
      const res = await createMatch(overs);
      const { matchCode } = res.data;
      registerHost(matchCode);
      toast.success(`Match created! Code: ${matchCode}`);
      navigate(`/team-setup/${matchCode}`);
    } catch (err) {
      toast.error('Failed to create match');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMatch = () => {
    if (!joinCode.trim()) {
      toast.error('Enter a match code');
      return;
    }
    setIsJoining(true);
    const code = joinCode.trim().toUpperCase();
    joinMatch(code);
    toast.success('Joining match...');
    navigate(`/live/${code}`);
  };

  return (
    <div className="home-page">
      {/* Decorative elements */}
      <div className="home-bg-orb home-bg-orb-1" />
      <div className="home-bg-orb home-bg-orb-2" />

      {/* Absolute Navbar (Top Center) */}
      <nav className="home-navbar animate-fade-in-down">
        <div className="nav-dev-branding">
          <div className="nav-dev-text">
            <h4>DEVELOPED BY</h4>
            <span className="dev-name">Gagandeep Kushwah</span>
          </div>
          <img src="/gagandeep.png" alt="Gagandeep Kushwah" className="dev-photo" />
        </div>
      </nav>

      <div className="home-content">
        {/* Logo & Title */}
        <div className="home-header animate-fade-in">
          <h1 className="home-title">NCA SCORING</h1>
          <p className="home-subtitle">Nibuapura Cricket Association Match Control & Statistics</p>
        </div>

        {/* Create Match Section */}
        <div className="home-card glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <div className="card-icon create-icon">⚡</div>
            <div>
              <h2 className="card-title">Create Match</h2>
              <p className="card-desc">Set up teams and start scoring</p>
            </div>
          </div>

          {!showCreateOptions ? (
            <button
              className="btn-primary home-btn"
              onClick={() => setShowCreateOptions(true)}
            >
              Create New Match
            </button>
          ) : (
            <div className="create-options">
              <div className="overs-selector">
                <label className="overs-label">Total Overs</label>
                <div className="overs-input-container">
                    <input
                      type="number"
                      className="input-field overs-input"
                      placeholder="Ex: 20"
                      value={totalOvers}
                      onChange={(e) => setTotalOvers(e.target.value)}
                      min="1"
                    />
                  <span className="overs-suffix">overs</span>
                </div>
              </div>
              <button
                className="btn-primary home-btn"
                onClick={handleCreateMatch}
                disabled={isCreating}
              >
                {isCreating ? (
                  <span className="btn-loading">Creating...</span>
                ) : (
                  'Start Match Setup →'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Join Match Section */}
        <div className="home-card glass-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <div className="card-icon join-icon">📡</div>
            <div>
              <h2 className="card-title">Join Match</h2>
              <p className="card-desc">Watch live scoring via match code</p>
            </div>
          </div>

          <div className="join-form">
            <input
              type="text"
              className="input-field match-code-input"
              placeholder="Enter 6-digit match code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinMatch()}
            />
            <button
              className="btn-secondary home-btn"
              onClick={handleJoinMatch}
              disabled={isJoining || joinCode.length < 6}
            >
              {isJoining ? 'Joining...' : 'Join Match'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="home-links animate-slide-up" style={{ animationDelay: '0.3s', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => navigate('/leaderboard')} style={{ width: '100%' }}>
            🏆 Top Performers
          </button>
          <button className="btn-secondary" onClick={() => navigate('/players')} style={{ width: '100%' }}>
            👤 All Players Profiles
          </button>
          <button className="btn-secondary" onClick={() => navigate('/history')} style={{ width: '100%' }}>
            📚 Match History
          </button>
        </div>
      </div>

      {/* Bottom Developer Banner */}
      <div className="dev-banner bottom-banner animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <img src="/gagandeep.png" alt="Gagandeep Kushwah" className="dev-photo" />
        <div className="dev-banner-text">
          <h4>DEVELOPED BY</h4>
          <span className="dev-name">Gagandeep Kushwah</span>
        </div>
      </div>
    </div>
  );
}
