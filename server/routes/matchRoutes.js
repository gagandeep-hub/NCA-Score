const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const generateMatchCode = require('../utils/matchCode');

// ========================================
// POST /api/matches — Create a new match
// ========================================
router.post('/', async (req, res) => {
  try {
    console.log('--- [MATCH_CREATE_START] ---');
    const { totalOvers } = req.body;
    console.log('Requested Overs:', totalOvers);

    // Generate a unique 6-char code
    let matchCode;
    let exists = true;
    while (exists) {
      matchCode = generateMatchCode();
      exists = await Match.findOne({ matchCode });
    }

    const match = await Match.create({
      matchCode,
      totalOvers: totalOvers || 20,
      status: 'setup',
      teams: [],
      innings: []
    });

    res.status(201).json({
      success: true,
      matchCode: match.matchCode,
      matchId: match._id
    });
  } catch (error) {
    console.error('--- [MATCH_CREATE_DEBUG] ---');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    res.status(500).json({ success: false, message: 'Failed to create match', dev_error: error.message });
  }
});

// ========================================
// GET /api/matches/history — Get match history
// ========================================
router.get('/history', async (req, res) => {
  try {
    const matches = await Match.find({ status: 'completed' })
      .sort({ updatedAt: -1 })
      .limit(50);

    // Trim old matches (keep only latest 50 completed)
    if (matches.length === 50) {
      const top50Ids = matches.map(m => m._id);
      Match.deleteMany({ status: 'completed', _id: { $nin: top50Ids } })
        .catch(err => console.error('Cleanup error:', err));
    }

    res.json({ success: true, matches });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get history' });
  }
});

// ========================================
// GET /api/matches/:code — Get match by code
// ========================================
router.get('/:code', async (req, res) => {
  try {
    const match = await Match.findOne({
      matchCode: req.params.code.toUpperCase()
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    res.json({ success: true, match });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ success: false, message: 'Failed to get match' });
  }
});

// ========================================
// PUT /api/matches/:code/teams — Save both teams
// ========================================
router.put('/:code/teams', async (req, res) => {
  try {
    const { teams } = req.body;
    // teams = [{ name, players: [{ name, isCaptain, isViceCaptain }] }, ...]

    if (!teams || teams.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Exactly 2 teams required'
      });
    }

    // Validate each team has at least 2 players
    for (const team of teams) {
      if (!team.name || !team.players || team.players.length < 2) {
        return res.status(400).json({
          success: false,
          message: `Team "${team.name || 'unnamed'}" needs at least 2 players`
        });
      }
    }

    const match = await Match.findOne({
      matchCode: req.params.code.toUpperCase()
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Build teams with default stats
    match.teams = teams.map(t => ({
      name: t.name,
      players: t.players.map(p => ({
        name: p.name,
        isCaptain: p.isCaptain || false,
        isViceCaptain: p.isViceCaptain || false,
        batting: { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, howOut: '' },
        bowling: { balls: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0 }
      }))
    }));

    match.status = 'toss';
    await match.save();

    res.json({ success: true, match });
  } catch (error) {
    console.error('Save teams error:', error);
    res.status(500).json({ success: false, message: 'Failed to save teams' });
  }
});

// ========================================
// PUT /api/matches/:code/toss — Save toss result
// ========================================
router.put('/:code/toss', async (req, res) => {
  try {
    const { winner, decision } = req.body;
    // winner = 0 or 1 (team index), decision = "bat" | "bowl"

    if (winner === undefined || !decision) {
      return res.status(400).json({
        success: false,
        message: 'Toss winner and decision required'
      });
    }

    const match = await Match.findOne({
      matchCode: req.params.code.toUpperCase()
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    match.toss = { winner, decision };

    // Determine batting/bowling order
    const battingTeamIndex = decision === 'bat' ? winner : (winner === 0 ? 1 : 0);
    const bowlingTeamIndex = battingTeamIndex === 0 ? 1 : 0;

    // Create first innings
    match.innings = [{
      battingTeamIndex,
      bowlingTeamIndex,
      totalRuns: 0,
      totalWickets: 0,
      totalBalls: 0,
      extras: { wides: 0, noBalls: 0, total: 0 },
      currentStriker: -1,
      currentNonStriker: -1,
      currentBowler: -1,
      needsBatsmanSelection: true,
      needsBowlerSelection: true,
      ballLog: [],
      isCompleted: false
    }];

    match.currentInnings = 0;
    match.status = 'live';
    await match.save();

    res.json({ success: true, match });
  } catch (error) {
    console.error('Save toss error:', error);
    res.status(500).json({ success: false, message: 'Failed to save toss' });
  }
});

// ========================================
// GET /api/matches/:code/summary — Get match summary
// ========================================
router.get('/:code/summary', async (req, res) => {
  try {
    const match = await Match.findOne({
      matchCode: req.params.code.toUpperCase()
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    res.json({ success: true, match });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get summary' });
  }
});

module.exports = router;
