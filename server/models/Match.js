const mongoose = require('mongoose');

// ===== PLAYER SUB-SCHEMA =====
const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  isCaptain: { type: Boolean, default: false },
  isViceCaptain: { type: Boolean, default: false },

  // Batting stats (per innings — reset each innings)
  batting: {
    runs:   { type: Number, default: 0 },
    balls:  { type: Number, default: 0 },
    fours:  { type: Number, default: 0 },
    sixes:  { type: Number, default: 0 },
    isOut:  { type: Boolean, default: false },
    howOut: { type: String, default: '' }
  },

  // Bowling stats (per innings)
  bowling: {
    balls:         { type: Number, default: 0 },   // legal deliveries
    runsConceded:  { type: Number, default: 0 },
    wickets:       { type: Number, default: 0 },
    wides:         { type: Number, default: 0 },
    noBalls:       { type: Number, default: 0 }
  }
});

// ===== BALL LOG SUB-SCHEMA =====
const ballLogSchema = new mongoose.Schema({
  runs:       { type: Number, default: 0 },     // runs by batsman
  extras:     { type: Number, default: 0 },     // extra runs
  extraType:  { type: String, default: '' },    // "wide" | "noball" | ""
  isWicket:   { type: Boolean, default: false },
  wicketType: { type: String, default: '' },    // "bowled","caught","runout", etc.
  batsmanIndex: Number,
  bowlerIndex:  Number,
  isLegal:    { type: Boolean, default: true },
  // Snapshot for undo
  strikerBefore:    Number,
  nonStrikerBefore: Number,
  timestamp:  { type: Date, default: Date.now }
}, { _id: false });

// ===== INNINGS SUB-SCHEMA =====
const inningsSchema = new mongoose.Schema({
  battingTeamIndex:  Number,
  bowlingTeamIndex:  Number,
  totalRuns:         { type: Number, default: 0 },
  totalWickets:      { type: Number, default: 0 },
  totalBalls:        { type: Number, default: 0 },    // legal balls only

  extras: {
    wides:   { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    total:   { type: Number, default: 0 }
  },

  currentStriker:    { type: Number, default: -1 },   // player array index
  currentNonStriker: { type: Number, default: -1 },
  currentBowler:     { type: Number, default: -1 },

  needsBatsmanSelection: { type: Boolean, default: false },
  needsBowlerSelection:  { type: Boolean, default: false },

  ballLog: [ballLogSchema],
  isCompleted: { type: Boolean, default: false }
}, { _id: false });

// ===== TEAM SUB-SCHEMA =====
const teamSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  players: [playerSchema]
}, { _id: false });

// ===== MAIN MATCH SCHEMA =====
const matchSchema = new mongoose.Schema({
  matchCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  status: {
    type: String,
    enum: ['setup', 'toss', 'live', 'innings_break', 'completed'],
    default: 'setup'
  },

  totalOvers: { type: Number, default: 20 },

  teams: [teamSchema],
  toss: {
    winner:   { type: Number, default: -1 },     // team index (0 or 1)
    decision: { type: String, default: '' }       // "bat" | "bowl"
  },

  innings:        [inningsSchema],
  currentInnings: { type: Number, default: 0 },
  result:         { type: String, default: '' },

  // Role tracking
  hostSocketId:     String,
  hostSessionId:    String,
  coHostSocketId:   String,
  coHostSessionId:  String,
  activeScorer:     { type: String, default: 'host' }  // "host" | "cohost"

}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
