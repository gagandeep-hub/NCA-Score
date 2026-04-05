import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '../context/MatchContext';
import { useSocket } from '../context/SocketContext';
import ScoreBoard from '../components/ScoreBoard';
import ScoringPanel from '../components/ScoringPanel';
import BatsmanCard from '../components/BatsmanCard';
import BowlerCard from '../components/BowlerCard';
import InningsSetup from '../components/InningsSetup';
import BallLog from '../components/BallLog';
import toast from 'react-hot-toast';
import './LiveMatchPage.css';

export default function LiveMatchPage() {
  const { matchCode } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const {
    match, role, viewerCount,
    joinMatch, updateScore, selectBatsman, selectBowler,
    startInnings, endInnings, undoBall
  } = useMatch();

  const [showEndInnings, setShowEndInnings] = useState(false);

  // Join match room on mount
  useEffect(() => {
    if (isConnected && matchCode) {
      // Only join if not already host (host registers via register-host)
      if (role !== 'host') {
        joinMatch(matchCode);
      }
    }
  }, [isConnected, matchCode]);

  // Listen for match events
  useEffect(() => {
    if (!socket) return;

    socket.on('innings-ended', ({ target }) => {
      toast(`Innings ended! Target: ${target}`, { icon: '🏏', duration: 4000 });
    });

    socket.on('match-completed', ({ result }) => {
      toast.success(result, { duration: 5000 });
      setTimeout(() => navigate(`/summary/${matchCode}`), 3000);
    });

    socket.on('scorer-changed', ({ message }) => {
      toast(message, { icon: '🔄', duration: 4000 });
    });

    socket.on('can-reclaim', ({ message }) => {
      toast(message, { icon: '👑', duration: 6000 });
    });

    socket.on('ball-undone', () => {
      toast('Last ball undone', { icon: '↩️' });
    });

    return () => {
      socket.off('innings-ended');
      socket.off('match-completed');
      socket.off('scorer-changed');
      socket.off('can-reclaim');
      socket.off('ball-undone');
    };
  }, [socket]);

  if (!match) {
    return (
      <div className="live-page">
        <div className="container loading-state">
          <div className="loading-spinner" />
          <p>Connecting to match...</p>
          {!isConnected && <p className="text-muted">Waiting for server connection</p>}
        </div>
      </div>
    );
  }

  const currentInnings = match.innings?.[match.currentInnings];
  const isScorer = role === 'host' || (role === 'cohost' && match.activeScorer === 'cohost');
  const needsInningsSetup = currentInnings &&
    (currentInnings.needsBatsmanSelection || currentInnings.needsBowlerSelection) &&
    currentInnings.currentStriker === -1;

  // Get team data
  const battingTeam = currentInnings ? match.teams[currentInnings.battingTeamIndex] : null;
  const bowlingTeam = currentInnings ? match.teams[currentInnings.bowlingTeamIndex] : null;

  return (
    <div className="live-page">
      {/* Top bar */}
      <div className="live-topbar">
        <div className="topbar-left">
          <span className="match-code-sm">{matchCode}</span>
          <span className={`connection-dot ${isConnected ? 'connected' : ''}`} />
        </div>
        <div className="topbar-center">
          <span className={`role-badge ${role}`}>
            {role === 'host' ? '👑 HOST' : role === 'cohost' ? '🛡️ CO-HOST' : '👁️ VIEWER'}
          </span>
        </div>
        <div className="topbar-right">
          <span className="viewer-count">👥 {viewerCount}</span>
        </div>
      </div>

      <div className="live-content">
        {/* Innings setup overlay */}
        {needsInningsSetup && isScorer && (
          <InningsSetup
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            onStart={startInnings}
            inningsNumber={match.currentInnings + 1}
            target={match.currentInnings === 1 ? match.innings[0].totalRuns + 1 : null}
          />
        )}

        {/* Batsman/Bowler selection after wicket/over */}
        {currentInnings?.needsBatsmanSelection && !needsInningsSetup && isScorer && (
          <div className="selection-overlay glass-card animate-slide-up">
            <h3 className="section-title">Select New Batsman</h3>
            <div className="selection-list">
              {battingTeam?.players.map((p, i) => {
                const isOut = p.batting.isOut;
                const isActive = i === currentInnings.currentStriker || i === currentInnings.currentNonStriker;
                if (isOut || isActive) return null;
                return (
                  <button key={i} className="selection-btn" onClick={() => selectBatsman(i)}>
                    {p.name} {p.isCaptain ? '(C)' : p.isViceCaptain ? '(VC)' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentInnings?.needsBowlerSelection && !needsInningsSetup && isScorer && (
          <div className="selection-overlay glass-card animate-slide-up">
            <h3 className="section-title">Select Bowler</h3>
            <div className="selection-list">
              {bowlingTeam?.players.map((p, i) => (
                <button
                  key={i}
                  className={`selection-btn ${i === currentInnings.currentBowler ? 'current' : ''}`}
                  onClick={() => selectBowler(i)}
                >
                  {p.name} {p.isCaptain ? '(C)' : ''} — {Math.floor(p.bowling.balls/6)}.{p.bowling.balls%6} ov
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scoreboard */}
        {currentInnings && (
          <ScoreBoard
            match={match}
            innings={currentInnings}
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
          />
        )}

        {/* Batsman & Bowler Cards */}
        {currentInnings && battingTeam && bowlingTeam && (
          <div className="player-cards">
            <BatsmanCard
              striker={currentInnings.currentStriker >= 0 ? battingTeam.players[currentInnings.currentStriker] : null}
              nonStriker={currentInnings.currentNonStriker >= 0 ? battingTeam.players[currentInnings.currentNonStriker] : null}
            />
            <BowlerCard
              bowler={currentInnings.currentBowler >= 0 ? bowlingTeam.players[currentInnings.currentBowler] : null}
            />
          </div>
        )}

        {/* Ball Log */}
        {currentInnings && <BallLog ballLog={currentInnings.ballLog} />}

        {/* Scoring Panel (Host/CoHost only) */}
        {isScorer && currentInnings && !currentInnings.needsBatsmanSelection && !currentInnings.needsBowlerSelection && (
          <ScoringPanel
            onScore={updateScore}
            onUndo={undoBall}
            onEndInnings={() => setShowEndInnings(true)}
            disabled={match.status !== 'live'}
          />
        )}

        {/* End Innings Confirmation */}
        {showEndInnings && (
          <div className="modal-overlay" onClick={() => setShowEndInnings(false)}>
            <div className="modal-card glass-card animate-slide-up" onClick={e => e.stopPropagation()}>
              <h3>End Innings?</h3>
              <p className="text-muted">Are you sure you want to end the current innings?</p>
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setShowEndInnings(false)}>Cancel</button>
                <button className="btn-primary" onClick={() => { endInnings(); setShowEndInnings(false); }}>
                  End Innings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Match Status Messages */}
        {match.status === 'innings_break' && !isScorer && (
          <div className="status-banner glass-card animate-fade-in">
            <span className="status-icon">⏸️</span>
            <span>Innings break — waiting for 2nd innings to start</span>
          </div>
        )}

        {match.status === 'completed' && (
          <div className="result-banner glass-card animate-slide-up">
            <span className="result-icon">🏆</span>
            <h2 className="result-text">{match.result}</h2>
            <button className="btn-primary" onClick={() => navigate(`/summary/${matchCode}`)}>
              View Full Summary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
