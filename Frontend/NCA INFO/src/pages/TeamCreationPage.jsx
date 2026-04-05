import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saveTeams } from '../services/api';
import toast from 'react-hot-toast';
import './TeamCreationPage.css';

export default function TeamCreationPage() {
  const { matchCode } = useParams();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([
    { name: '', players: [] },
    { name: '', players: [] }
  ]);

  const [activeTeam, setActiveTeam] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currentTeam = teams[activeTeam];

  const addPlayer = () => {
    if (!playerName.trim()) return;
    if (currentTeam.players.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
      toast.error('Player already exists');
      return;
    }

    const updated = [...teams];
    updated[activeTeam].players.push({
      name: playerName.trim(),
      isCaptain: false,
      isViceCaptain: false
    });
    setTeams(updated);
    setPlayerName('');
  };

  const removePlayer = (index) => {
    const updated = [...teams];
    updated[activeTeam].players.splice(index, 1);
    setTeams(updated);
  };

  const toggleCaptain = (index) => {
    const updated = [...teams];
    // Remove old captain
    updated[activeTeam].players.forEach((p, i) => {
      if (i !== index) p.isCaptain = false;
    });
    updated[activeTeam].players[index].isCaptain = !updated[activeTeam].players[index].isCaptain;
    // Can't be both C and VC
    if (updated[activeTeam].players[index].isCaptain) {
      updated[activeTeam].players[index].isViceCaptain = false;
    }
    setTeams(updated);
  };

  const toggleViceCaptain = (index) => {
    const updated = [...teams];
    updated[activeTeam].players.forEach((p, i) => {
      if (i !== index) p.isViceCaptain = false;
    });
    updated[activeTeam].players[index].isViceCaptain = !updated[activeTeam].players[index].isViceCaptain;
    if (updated[activeTeam].players[index].isViceCaptain) {
      updated[activeTeam].players[index].isCaptain = false;
    }
    setTeams(updated);
  };

  const updateTeamName = (name) => {
    const updated = [...teams];
    updated[activeTeam].name = name;
    setTeams(updated);
  };

  const handleSaveTeams = async () => {
    // Validation
    for (let i = 0; i < 2; i++) {
      if (!teams[i].name.trim()) {
        toast.error(`Team ${i + 1} needs a name`);
        return;
      }
      if (teams[i].players.length < 2) {
        toast.error(`${teams[i].name} needs at least 2 players`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await saveTeams(matchCode, teams);
      toast.success('Teams saved! Proceed to toss');
      navigate(`/toss/${matchCode}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save teams');
    } finally {
      setIsSaving(false);
    }
  };

  const isReady = teams.every(t => t.name.trim() && t.players.length >= 2);

  return (
    <div className="team-page">
      <div className="container">
        {/* Header */}
        <div className="team-header animate-fade-in">
          <span className="match-code-badge">{matchCode}</span>
          <h1 className="page-title">Team Setup</h1>
          <p className="page-subtitle">Add players to both teams</p>
        </div>

        {/* Team Tabs */}
        <div className="team-tabs animate-slide-up">
          {[0, 1].map(i => (
            <button
              key={i}
              className={`team-tab ${activeTeam === i ? 'active' : ''}`}
              onClick={() => setActiveTeam(i)}
            >
              <span className="tab-label">
                {teams[i].name || `Team ${i + 1}`}
              </span>
              <span className="tab-count">{teams[i].players.length} players</span>
              {teams[i].name && teams[i].players.length >= 2 && (
                <span className="tab-check">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Team Form */}
        <div className="team-form glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <input
            type="text"
            className="input-field team-name-input"
            placeholder={`Team ${activeTeam + 1} name`}
            value={currentTeam.name}
            onChange={(e) => updateTeamName(e.target.value)}
          />

          {/* Add player */}
          <div className="add-player-row">
            <input
              type="text"
              className="input-field player-input"
              placeholder="Player name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            />
            <button
              className="btn-add"
              onClick={addPlayer}
              disabled={!playerName.trim()}
            >
              +
            </button>
          </div>

          {/* Player List */}
          <div className="player-list">
            {currentTeam.players.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">👤</span>
                <p>Add players to {currentTeam.name || `Team ${activeTeam + 1}`}</p>
              </div>
            ) : (
              currentTeam.players.map((player, index) => (
                <div key={index} className="player-item animate-fade-in">
                  <div className="player-info">
                    <span className="player-number">{index + 1}</span>
                    <span className="player-name">{player.name}</span>
                    {player.isCaptain && <span className="captain-badge">C</span>}
                    {player.isViceCaptain && <span className="vc-badge">VC</span>}
                  </div>
                  <div className="player-actions">
                    <button
                      className={`role-btn ${player.isCaptain ? 'active-c' : ''}`}
                      onClick={() => toggleCaptain(index)}
                      title="Captain"
                    >
                      C
                    </button>
                    <button
                      className={`role-btn ${player.isViceCaptain ? 'active-vc' : ''}`}
                      onClick={() => toggleViceCaptain(index)}
                      title="Vice Captain"
                    >
                      VC
                    </button>
                    <button
                      className="remove-btn"
                      onClick={() => removePlayer(index)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Save Button */}
        <button
          className="btn-primary save-teams-btn animate-slide-up"
          style={{ animationDelay: '0.2s' }}
          onClick={handleSaveTeams}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Teams & Go to Toss →'}
        </button>
      </div>
    </div>
  );
}
