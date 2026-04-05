import './BowlerCard.css';

export default function BowlerCard({ bowler }) {
  if (!bowler) return null;

  const overs = `${Math.floor(bowler.bowling.balls / 6)}.${bowler.bowling.balls % 6}`;
  const econ = bowler.bowling.balls > 0
    ? ((bowler.bowling.runsConceded / bowler.bowling.balls) * 6).toFixed(2)
    : '0.00';

  return (
    <div className="bowler-card glass-card">
      <div className="card-label">BOWLING</div>
      <div className="bowler-row">
        <div className="bowler-info">
          <span className="bowler-name">
            ⚾ {bowler.name}
            {bowler.isCaptain && <sup className="cap-tag">C</sup>}
          </span>
        </div>
        <div className="bowler-stats">
          <span className="bstat">{overs} ov</span>
          <span className="bstat">{bowler.bowling.runsConceded}r</span>
          <span className="bstat wickets">{bowler.bowling.wickets}w</span>
          <span className="bstat econ">E {econ}</span>
        </div>
      </div>
    </div>
  );
}
