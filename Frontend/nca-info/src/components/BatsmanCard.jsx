import './BatsmanCard.css';

export default function BatsmanCard({ striker, nonStriker }) {
  const renderBatsman = (player, isStriker) => {
    if (!player) return null;
    const sr = player.batting.balls > 0
      ? ((player.batting.runs / player.batting.balls) * 100).toFixed(1)
      : '0.0';

    return (
      <div className={`batsman-row ${isStriker ? 'striker' : ''}`}>
        <div className="batsman-info">
          <span className="batsman-name">
            {isStriker && <span className="striker-dot" />}
            {player.name}
            {player.isCaptain && <sup className="cap-tag">C</sup>}
            {player.isViceCaptain && <sup className="cap-tag">VC</sup>}
          </span>
        </div>
        <div className="batsman-stats">
          <span className="stat-runs">{player.batting.runs}</span>
          <span className="stat-balls">({player.batting.balls})</span>
          <span className="stat-detail">{player.batting.fours}×4</span>
          <span className="stat-detail">{player.batting.sixes}×6</span>
          <span className="stat-sr">SR {sr}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="batsman-card glass-card">
      <div className="card-label">BATTING</div>
      {renderBatsman(striker, true)}
      {nonStriker && <div className="batsman-divider" />}
      {renderBatsman(nonStriker, false)}
    </div>
  );
}
