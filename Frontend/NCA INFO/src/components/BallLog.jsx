import './BallLog.css';

export default function BallLog({ ballLog }) {
  if (!ballLog || ballLog.length === 0) return null;

  // Group balls by over (6 legal deliveries per over)
  const overs = [];
  let currentOver = [];
  let legalCount = 0;

  for (const ball of ballLog) {
    currentOver.push(ball);
    if (ball.isLegal) {
      legalCount++;
      if (legalCount % 6 === 0) {
        overs.push(currentOver);
        currentOver = [];
      }
    }
  }
  if (currentOver.length > 0) overs.push(currentOver);

  const getBallClass = (ball) => {
    if (ball.isWicket) return 'ball-wicket';
    if (ball.extraType === 'wide') return 'ball-wide';
    if (ball.extraType === 'noball') return 'ball-noball';
    if (ball.runs === 4) return 'ball-four';
    if (ball.runs === 6) return 'ball-six';
    if (ball.runs === 0) return 'ball-dot';
    return 'ball-run';
  };

  const getBallText = (ball) => {
    if (ball.isWicket) return 'W';
    if (ball.extraType === 'wide') return `WD`;
    if (ball.extraType === 'noball') return `NB`;
    return ball.runs.toString();
  };

  // Show only last 2 overs
  const recentOvers = overs.slice(-2);

  return (
    <div className="ball-log glass-card">
      <div className="card-label">THIS OVER</div>
      <div className="overs-container">
        {recentOvers.map((over, oi) => (
          <div key={oi} className="over-row">
            <span className="over-number">{overs.indexOf(over) + 1}</span>
            <div className="over-balls">
              {over.map((ball, bi) => (
                <span key={bi} className={`ball-chip ${getBallClass(ball)}`}>
                  {getBallText(ball)}
                </span>
              ))}
            </div>
            <span className="over-total">
              {over.reduce((s, b) => s + b.runs + b.extras, 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
