import { useState } from 'react';
import './InningsSetup.css';

export default function InningsSetup({ battingTeam, bowlingTeam, onStart, inningsNumber, target }) {
  const [striker, setStriker] = useState(-1);
  const [nonStriker, setNonStriker] = useState(-1);
  const [bowler, setBowler] = useState(-1);

  const handleStart = () => {
    if (striker === -1 || nonStriker === -1 || bowler === -1) return;
    onStart(striker, nonStriker, bowler);
  };

  const isReady = striker !== -1 && nonStriker !== -1 && bowler !== -1;

  return (
    <div className="innings-setup glass-card animate-slide-up">
      <div className="setup-header">
        <span className="setup-innings">Innings {inningsNumber}</span>
        <h2 className="setup-title">Select Players</h2>
        {target && <p className="setup-target">Target: {target} runs</p>}
      </div>

      {/* Striker */}
      <div className="setup-section">
        <h4 className="setup-label">🏏 Striker</h4>
        <div className="setup-options">
          {battingTeam?.players.map((p, i) => (
            <button
              key={i}
              className={`setup-btn ${striker === i ? 'selected' : ''} ${nonStriker === i ? 'disabled' : ''}`}
              onClick={() => nonStriker !== i && setStriker(i)}
              disabled={nonStriker === i}
            >
              {p.name} {p.isCaptain ? '(C)' : p.isViceCaptain ? '(VC)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Non-Striker */}
      <div className="setup-section">
        <h4 className="setup-label">🏏 Non-Striker</h4>
        <div className="setup-options">
          {battingTeam?.players.map((p, i) => (
            <button
              key={i}
              className={`setup-btn ${nonStriker === i ? 'selected' : ''} ${striker === i ? 'disabled' : ''}`}
              onClick={() => striker !== i && setNonStriker(i)}
              disabled={striker === i}
            >
              {p.name} {p.isCaptain ? '(C)' : p.isViceCaptain ? '(VC)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Bowler */}
      <div className="setup-section">
        <h4 className="setup-label">⚾ Opening Bowler</h4>
        <div className="setup-options">
          {bowlingTeam?.players.map((p, i) => (
            <button
              key={i}
              className={`setup-btn ${bowler === i ? 'selected' : ''}`}
              onClick={() => setBowler(i)}
            >
              {p.name} {p.isCaptain ? '(C)' : ''}
            </button>
          ))}
        </div>
      </div>

      <button className="btn-primary start-btn" onClick={handleStart} disabled={!isReady}>
        Start Innings →
      </button>
    </div>
  );
}
