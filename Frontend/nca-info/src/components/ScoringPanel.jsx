import { useState } from 'react';
import './ScoringPanel.css';

export default function ScoringPanel({ onScore, onUndo, onEndInnings, disabled }) {
  const [showWicketModal, setShowWicketModal] = useState(false);

  const handleScore = (action, value) => {
    if (disabled) return;
    onScore(action, value);
  };

  const handleWicketSelect = (type) => {
    handleScore('wicket', { type });
    setShowWicketModal(false);
  };

  return (
    <div className="scoring-panel">
      {/* Run buttons */}
      <div className="scoring-section">
        <div className="scoring-row runs-row">
          <button className="score-btn dot-btn" onClick={() => handleScore('run', 0)} disabled={disabled}>
            <span className="btn-value">0</span>
            <span className="btn-label">Dot</span>
          </button>
          <button className="score-btn run-btn" onClick={() => handleScore('run', 1)} disabled={disabled}>
            <span className="btn-value">1</span>
          </button>
          <button className="score-btn run-btn" onClick={() => handleScore('run', 2)} disabled={disabled}>
            <span className="btn-value">2</span>
          </button>
          <button className="score-btn run-btn" onClick={() => handleScore('run', 3)} disabled={disabled}>
            <span className="btn-value">3</span>
          </button>
        </div>

        <div className="scoring-row boundary-row">
          <button className="score-btn four-btn" onClick={() => handleScore('run', 4)} disabled={disabled}>
            <span className="btn-value">4</span>
            <span className="btn-label">FOUR</span>
          </button>
          <button className="score-btn six-btn" onClick={() => handleScore('run', 6)} disabled={disabled}>
            <span className="btn-value">6</span>
            <span className="btn-label">SIX</span>
          </button>
        </div>
      </div>

      {/* Extras & Wicket */}
      <div className="scoring-section">
        <div className="scoring-row extras-row">
          <button className="score-btn wide-btn" onClick={() => handleScore('wide', 1)} disabled={disabled}>
            <span className="btn-value">WD</span>
            <span className="btn-label">Wide</span>
          </button>
          <button className="score-btn nb-btn" onClick={() => handleScore('noball', 1)} disabled={disabled}>
            <span className="btn-value">NB</span>
            <span className="btn-label">No Ball</span>
          </button>
          <button className="score-btn wicket-btn" onClick={() => setShowWicketModal(true)} disabled={disabled}>
            <span className="btn-value">W</span>
            <span className="btn-label">Wicket</span>
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="scoring-actions">
        <button className="action-btn undo-btn" onClick={onUndo} disabled={disabled}>
          ↩ Undo
        </button>
        <button className="action-btn end-innings-btn" onClick={onEndInnings} disabled={disabled}>
          End Innings
        </button>
      </div>

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="wicket-modal-overlay">
          <div className="wicket-modal glass-card animate-slide-up">
            <h3>How Out?</h3>
            <div className="wicket-grid">
              {['bowled', 'caught', 'lbw', 'runout', 'stumped', 'hitwicket'].map(type => (
                <button 
                  key={type} 
                  className="wicket-type-btn"
                  onClick={() => handleWicketSelect(type)}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="btn-secondary cancel-wicket-btn" onClick={() => setShowWicketModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
