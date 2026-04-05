import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMatchSummary } from '../services/api';
import './SummaryPage.css';

export default function SummaryPage() {
  const { matchCode } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const res = await getMatchSummary(matchCode);
      setMatch(res.data.match);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  if (!match) {
    return (
      <div className="summary-page">
        <div className="container loading-state">
          <div className="loading-spinner" />
          <p>Loading summary...</p>
        </div>
      </div>
    );
  }

  const formatOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

  const renderScorecard = (innings, inningsIdx) => {
    if (!innings) return null;
    const battingTeam = match.teams[innings.battingTeamIndex];
    const bowlingTeam = match.teams[innings.bowlingTeamIndex];

    return (
      <div className="innings-card glass-card" key={inningsIdx}>
        <div className="innings-header">
          <h3 className="innings-title">{battingTeam.name} — Innings {inningsIdx + 1}</h3>
          <div className="innings-score">
            {innings.totalRuns}/{innings.totalWickets}
            <span className="innings-overs">({formatOvers(innings.totalBalls)} ov)</span>
          </div>
        </div>

        {/* Batting */}
        <div className="stats-section">
          <h4 className="stats-title">Batting</h4>
          <table className="stats-table">
            <thead>
              <tr>
                <th className="th-name">Batsman</th>
                <th>R</th>
                <th>B</th>
                <th>4s</th>
                <th>6s</th>
                <th>SR</th>
              </tr>
            </thead>
            <tbody>
              {battingTeam.players.map((p, i) => {
                if (p.batting.balls === 0 && !p.batting.isOut) return null;
                const sr = p.batting.balls > 0
                  ? ((p.batting.runs / p.batting.balls) * 100).toFixed(1)
                  : '-';
                return (
                  <tr key={i} className={p.batting.isOut ? 'out' : ''}>
                    <td className="td-name">
                      {p.name}
                      {p.isCaptain && <sup>C</sup>}
                      {p.isViceCaptain && <sup>VC</sup>}
                      {p.batting.isOut && <span className="how-out">{p.batting.howOut}</span>}
                      {!p.batting.isOut && p.batting.balls > 0 && <span className="not-out">not out</span>}
                    </td>
                    <td className="td-runs">{p.batting.runs}</td>
                    <td>{p.batting.balls}</td>
                    <td>{p.batting.fours}</td>
                    <td>{p.batting.sixes}</td>
                    <td>{sr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="extras-line">
            Extras: {innings.extras.total} (WD {innings.extras.wides}, NB {innings.extras.noBalls})
          </div>
        </div>

        {/* Bowling */}
        <div className="stats-section">
          <h4 className="stats-title">Bowling</h4>
          <table className="stats-table">
            <thead>
              <tr>
                <th className="th-name">Bowler</th>
                <th>O</th>
                <th>R</th>
                <th>W</th>
                <th>Econ</th>
              </tr>
            </thead>
            <tbody>
              {bowlingTeam.players.map((p, i) => {
                if (p.bowling.balls === 0 && p.bowling.runsConceded === 0) return null;
                const totalBalls = p.bowling.balls;
                const econ = totalBalls > 0
                  ? ((p.bowling.runsConceded / totalBalls) * 6).toFixed(2)
                  : '-';
                return (
                  <tr key={i}>
                    <td className="td-name">
                      {p.name}{p.isCaptain && <sup>C</sup>}
                    </td>
                    <td>{formatOvers(totalBalls)}</td>
                    <td>{p.bowling.runsConceded}</td>
                    <td className="td-wickets">{p.bowling.wickets}</td>
                    <td>{econ}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="summary-page">
      <div className="container">
        <div className="summary-header animate-fade-in">
          <span className="match-code-badge">{matchCode}</span>
          <h1 className="page-title">Match Summary</h1>
        </div>

        {/* Result */}
        {match.result && (
          <div className="result-card glass-card animate-slide-up">
            <span className="result-trophy">🏆</span>
            <h2 className="result-line">{match.result}</h2>
          </div>
        )}

        {/* Scorecards */}
        {match.innings.map((inn, idx) => renderScorecard(inn, idx))}

        {/* Back button */}
        <button className="btn-primary back-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
