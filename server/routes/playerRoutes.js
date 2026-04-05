const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

// ========================================
// GET /api/players/leaderboard — Get top players
// ========================================
router.get('/leaderboard', async (req, res) => {
  try {
    const players = await Player.find({ matchesPlayed: { $gt: 0 } }).exec();
    const playersObj = players.map(p => p.toObject({ virtuals: true }));

    const mostRuns = [...playersObj].sort((a, b) => b.batting.totalRuns - a.batting.totalRuns).slice(0, 10);
    const mostWickets = [...playersObj].sort((a, b) => {
      if (b.bowling.wickets !== a.bowling.wickets) {
        return b.bowling.wickets - a.bowling.wickets;
      }
      return parseFloat(a.economyRate) - parseFloat(b.economyRate);
    }).slice(0, 10);
    const highestScore = [...playersObj].sort((a, b) => b.batting.highestScore - a.batting.highestScore).slice(0, 10);
    const highestStrikeRate = [...playersObj]
      .filter(p => p.batting.ballsFaced >= 20)
      .sort((a, b) => parseFloat(b.strikeRate) - parseFloat(a.strikeRate))
      .slice(0, 10);

    res.json({
      success: true,
      leaderboards: { mostRuns, mostWickets, highestScore, highestStrikeRate }
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
});

// ========================================
// GET /api/players/all — Get all players stats (Cricbuzz Style)
// ========================================
router.get('/all', async (req, res) => {
  try {
    const players = await Player.find({ matchesPlayed: { $gt: 0 } }).sort({ 'batting.totalRuns': -1 }).exec();
    const playersObj = players.map(p => p.toObject({ virtuals: true }));
    res.json({ success: true, players: playersObj });
  } catch (error) {
    console.error('All players error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch players' });
  }
});

module.exports = router;
