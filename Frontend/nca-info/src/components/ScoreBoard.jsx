import './ScoreBoard.css';

export default function ScoreBoard({ match, innings, battingTeam, bowlingTeam }) {
  if (!innings || !battingTeam) return null;

  const overs = `${Math.floor(innings.totalBalls / 6)}.${innings.totalBalls % 6}`;
  const maxOvers = match.totalOvers;
  const target = match.currentInnings === 1 ? match.innings[0].totalRuns + 1 : null;
  const remaining = target ? target - innings.totalRuns : null;
  const ballsLeft = target ? (maxOvers * 6 - innings.totalBalls) : null;
  const rrr = remaining && ballsLeft > 0 ? ((remaining / ballsLeft) * 6).toFixed(2) : null;
  const crr = innings.totalBalls > 0 ? ((innings.totalRuns / innings.totalBalls) * 6).toFixed(2) : '0.00';

  return (
    <div className="scoreboard glass-card">
      {/* Team names */}
      <div className="sb-teams">
        <span className="sb-batting-team">{battingTeam.name}</span>
        <span className="sb-vs">vs</span>
        <span className="sb-bowling-team">{bowlingTeam.name}</span>
      </div>

      {/* Main score */}
      <div className="sb-main-score">
        <span className="sb-runs">{innings.totalRuns}</span>
        <span className="sb-separator">/</span>
        <span className="sb-wickets">{innings.totalWickets}</span>
        <span className="sb-overs">({overs}/{maxOvers} ov)</span>
      </div>

      {/* Target info */}
      {target && (
        <div className="sb-target">
          {remaining > 0 ? (
            <span>Need <strong>{remaining}</strong> from <strong>{ballsLeft}</strong> balls</span>
          ) : (
            <span>Target: {target}</span>
          )}
        </div>
      )}

      {/* Extras & Run Rate */}
      <div className="sb-details">
        <div className="sb-extras">
          Extras: <strong>{innings.extras.total}</strong>
          <span className="extras-breakdown">
            (WD {innings.extras.wides}, NB {innings.extras.noBalls})
          </span>
        </div>
        <div className="sb-rates">
          <span>CRR: <strong>{crr}</strong></span>
          {rrr && <span>RRR: <strong>{rrr}</strong></span>}
        </div>
      </div>

      {/* Innings indicator */}
      <div className="sb-innings-indicator">
        <span className={`innings-dot ${match.currentInnings === 0 ? 'active' : 'done'}`}>1st</span>
        <span className={`innings-dot ${match.currentInnings === 1 ? 'active' : ''}`}>2nd</span>
      </div>
    </div>
  );
}
