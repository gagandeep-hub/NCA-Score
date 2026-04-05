const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // We store lowercase or normalized name, or rely on distinct query lookup
    trim: true
  },
  matchesPlayed: {
    type: Number,
    default: 0
  },
  batting: {
    totalRuns: { type: Number, default: 0 },
    ballsFaced: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    fifties: { type: Number, default: 0 },
    hundreds: { type: Number, default: 0 },
    timesOut: { type: Number, default: 0 } // To calculate batting average
  },
  bowling: {
    ballsBowled: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    bestBowling: {
      wickets: { type: Number, default: 0 },
      runs: { type: Number, default: 0 }
    },
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Virtual to calculate Batting Average
playerSchema.virtual('battingAverage').get(function() {
  if (this.batting.timesOut === 0) return this.batting.totalRuns; // Infinite average, but practically total runs
  return (this.batting.totalRuns / this.batting.timesOut).toFixed(2);
});

// Virtual to calculate Batting Strike Rate
playerSchema.virtual('strikeRate').get(function() {
  if (this.batting.ballsFaced === 0) return 0;
  return ((this.batting.totalRuns / this.batting.ballsFaced) * 100).toFixed(2);
});

// Virtual to calculate Bowling Economy
playerSchema.virtual('economyRate').get(function() {
  if (this.bowling.ballsBowled === 0) return 0;
  return ((this.bowling.runsConceded / this.bowling.ballsBowled) * 6).toFixed(2);
});

// Ensure virtuals are included in JSON output
playerSchema.set('toJSON', { virtuals: true });
playerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Player', playerSchema);
