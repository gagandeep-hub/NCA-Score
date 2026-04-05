const Match = require('../models/Match');
const Player = require('../models/Player');

// =============================================
// HELPER FUNCTIONS
// =============================================

/** Check if the socket is the current active scorer */
function isActiveScorer(match, socketId) {
  if (match.activeScorer === 'host') return match.hostSocketId === socketId;
  if (match.activeScorer === 'cohost') return match.coHostSocketId === socketId;
  return false;
}

/** Get the current innings object */
function getCurrentInnings(match) {
  return match.innings[match.currentInnings];
}

/** Check if the innings should end */
function checkInningsComplete(match, innings) {
  const maxBalls = match.totalOvers * 6;
  const maxWickets = match.teams[innings.battingTeamIndex].players.length - 1;

  // All overs bowled
  if (innings.totalBalls >= maxBalls) return true;
  // All out
  if (innings.totalWickets >= maxWickets) return true;
  // 2nd innings: target chased
  if (match.currentInnings === 1) {
    if (innings.totalRuns > match.innings[0].totalRuns) return true;
  }
  return false;
}

/** Determine match result string */
function getMatchResult(match) {
  const first = match.innings[0];
  const second = match.innings[1];
  const battingTeamName = match.teams[second.battingTeamIndex].name;
  const bowlingTeamName = match.teams[second.bowlingTeamIndex].name;

  if (second.totalRuns > first.totalRuns) {
    const wicketsLeft = match.teams[second.battingTeamIndex].players.length - 1 - second.totalWickets;
    return `${battingTeamName} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
  } else if (second.totalRuns === first.totalRuns) {
    return 'Match Tied';
  } else {
    const runsDiff = first.totalRuns - second.totalRuns;
    return `${bowlingTeamName} won by ${runsDiff} run${runsDiff !== 1 ? 's' : ''}`;
  }
}

/** Tally and save stats for all players globally after match completion */
async function persistMatchStats(match) {
  try {
    for (const team of match.teams) {
      for (const p of team.players) {
        // Skip players who didn't bat or bowl at all to avoid polluting records for simple subs
        if (p.batting.balls === 0 && p.bowling.balls === 0 && p.bowling.runsConceded === 0 && !p.batting.isOut) {
           continue; 
        }

        const normalizedName = p.name.trim().toLowerCase();
        let globalPlayer = await Player.findOne({ name: { $regex: new RegExp(`^${normalizedName}$`, 'i') } });
        
        if (!globalPlayer) {
          globalPlayer = new Player({ name: p.name.trim() });
        }
        
        // Accumulate Batting Stats
        globalPlayer.matchesPlayed += 1;
        globalPlayer.batting.totalRuns += p.batting.runs;
        globalPlayer.batting.ballsFaced += p.batting.balls;
        globalPlayer.batting.fours += p.batting.fours;
        globalPlayer.batting.sixes += p.batting.sixes;
        
        if (p.batting.runs > globalPlayer.batting.highestScore) {
          globalPlayer.batting.highestScore = p.batting.runs;
        }
        
        // Count 50s and 100s
        if (p.batting.runs >= 100) {
          globalPlayer.batting.hundreds += 1;
        } else if (p.batting.runs >= 50) {
          globalPlayer.batting.fifties += 1;
        }

        if (p.batting.isOut) {
          globalPlayer.batting.timesOut += 1;
        }

        // Accumulate Bowling Stats
        globalPlayer.bowling.ballsBowled += p.bowling.balls;
        globalPlayer.bowling.runsConceded += p.bowling.runsConceded;
        globalPlayer.bowling.wickets += p.bowling.wickets;
        globalPlayer.bowling.wides += p.bowling.wides;
        globalPlayer.bowling.noBalls += p.bowling.noBalls;

        // Check Best Bowling (Most wickets, or same wickets but fewer runs)
        if (p.bowling.wickets > globalPlayer.bowling.bestBowling.wickets || 
           (p.bowling.wickets === globalPlayer.bowling.bestBowling.wickets && p.bowling.runsConceded < globalPlayer.bowling.bestBowling.runs)) {
           globalPlayer.bowling.bestBowling = {
             wickets: p.bowling.wickets,
             runs: p.bowling.runsConceded
           };
        }

        await globalPlayer.save();
      }
    }
    console.log(`Global Player stats persisted for match ${match.matchCode}`);
  } catch (err) {
    console.error('Failed to persist player stats:', err);
  }
}

// =============================================
// MAIN SOCKET HANDLER
// =============================================
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ Connected: ${socket.id}`);

    // ------------------------------------------
    // JOIN MATCH — called by all users
    // ------------------------------------------
    socket.on('join-match', async ({ matchCode, sessionId }) => {
      try {
        const match = await Match.findOne({ matchCode: matchCode.toUpperCase() });
        if (!match) return socket.emit('error', { message: 'Match not found' });

        socket.join(matchCode);
        socket.matchCode = matchCode;
        socket.sessionId = sessionId;

        let role = 'viewer';

        // Reconnect check: host
        if (match.hostSessionId && match.hostSessionId === sessionId) {
          role = 'host';
          match.hostSocketId = socket.id;
          if (match.activeScorer === 'cohost' && match.coHostSocketId) {
            socket.emit('can-reclaim', {
              message: 'Co-Host is currently scoring. You can reclaim control.'
            });
          }
          await match.save();
        }
        // Reconnect check: co-host
        else if (match.coHostSessionId && match.coHostSessionId === sessionId) {
          role = 'cohost';
          match.coHostSocketId = socket.id;
          await match.save();
        }

        socket.role = role;
        socket.emit('match-state', { match: match.toObject(), role });

        // Broadcast viewer count
        const room = io.sockets.adapter.rooms.get(matchCode);
        io.to(matchCode).emit('viewer-count', { count: room ? room.size : 0 });

      } catch (err) {
        console.error('join-match error:', err);
        socket.emit('error', { message: 'Failed to join match' });
      }
    });

    // ------------------------------------------
    // REGISTER HOST — called after creating match via REST
    // ------------------------------------------
    socket.on('register-host', async ({ matchCode, sessionId }) => {
      try {
        const match = await Match.findOne({ matchCode });
        if (!match) return socket.emit('error', { message: 'Match not found' });

        match.hostSocketId = socket.id;
        match.hostSessionId = sessionId;
        match.activeScorer = 'host';
        await match.save();

        socket.join(matchCode);
        socket.matchCode = matchCode;
        socket.sessionId = sessionId;
        socket.role = 'host';

        socket.emit('match-state', { match: match.toObject(), role: 'host' });
      } catch (err) {
        console.error('register-host error:', err);
        socket.emit('error', { message: 'Failed to register as host' });
      }
    });

    // ------------------------------------------
    // ASSIGN CO-HOST
    // ------------------------------------------
    socket.on('assign-cohost', async ({ matchCode, targetSocketId }) => {
      try {
        const match = await Match.findOne({ matchCode });
        if (!match) return socket.emit('error', { message: 'Match not found' });
        if (match.hostSocketId !== socket.id) {
          return socket.emit('error', { message: 'Only host can assign co-host' });
        }

        // Generate a session ID for the co-host (for reconnection)
        const coHostSessionId = require('crypto').randomUUID();
        match.coHostSocketId = targetSocketId;
        match.coHostSessionId = coHostSessionId;
        await match.save();

        // Notify the promoted user
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.role = 'cohost';
          targetSocket.emit('role-changed', { role: 'cohost', sessionId: coHostSessionId });
        }

        // Broadcast to room
        io.to(matchCode).emit('cohost-assigned', {
          coHostSocketId: targetSocketId,
          message: 'A Co-Host has been assigned'
        });
      } catch (err) {
        console.error('assign-cohost error:', err);
        socket.emit('error', { message: 'Failed to assign co-host' });
      }
    });

    // ------------------------------------------
    // REMOVE CO-HOST
    // ------------------------------------------
    socket.on('remove-cohost', async ({ matchCode }) => {
      try {
        const match = await Match.findOne({ matchCode });
        if (!match || match.hostSocketId !== socket.id) return;

        const oldCoHostId = match.coHostSocketId;
        match.coHostSocketId = null;
        match.coHostSessionId = null;
        if (match.activeScorer === 'cohost') match.activeScorer = 'host';
        await match.save();

        if (oldCoHostId) {
          const target = io.sockets.sockets.get(oldCoHostId);
          if (target) {
            target.role = 'viewer';
            target.emit('role-changed', { role: 'viewer' });
          }
        }

        io.to(matchCode).emit('cohost-removed', { message: 'Co-Host removed' });
      } catch (err) {
        console.error('remove-cohost error:', err);
      }
    });

    // ------------------------------------------
    // START INNINGS — select openers + bowler
    // ------------------------------------------
    socket.on('start-innings', async ({ matchCode, strikerIndex, nonStrikerIndex, bowlerIndex }) => {
      try {
        const match = await Match.findOne({ matchCode });
        if (!match) return;
        if (!isActiveScorer(match, socket.id)) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        const innings = getCurrentInnings(match);
        if (!innings) return;

        innings.currentStriker = strikerIndex;
        innings.currentNonStriker = nonStrikerIndex;
        innings.currentBowler = bowlerIndex;
        innings.needsBatsmanSelection = false;
        innings.needsBowlerSelection = false;
        match.status = 'live';
        await match.save();

        io.to(matchCode).emit('match-state', { match: match.toObject() });
        io.to(matchCode).emit('innings-started', {
          inningsNumber: match.currentInnings + 1
        });
      } catch (err) {
        console.error('start-innings error:', err);
      }
    });

    // ------------------------------------------
    // UPDATE SCORE — the core scoring engine
    // ------------------------------------------
    socket.on('update-score', async ({ matchCode, action, value }) => {
      try {
        const match = await Match.findOne({ matchCode });
        if (!match) return;
        if (!isActiveScorer(match, socket.id)) {
          return socket.emit('error', { message: 'Not authorized to score' });
        }
        if (match.status !== 'live') {
          return socket.emit('error', { message: 'Match is not live' });
        }

        const innings = getCurrentInnings(match);
        if (!innings || innings.isCompleted) return;
        if (innings.needsBatsmanSelection) {
          return socket.emit('error', { message: 'Select new batsman first' });
        }
        if (innings.needsBowlerSelection) {
          return socket.emit('error', { message: 'Select new bowler first' });
        }

        const battingTeam = match.teams[innings.battingTeamIndex];
        const bowlingTeam = match.teams[innings.bowlingTeamIndex];
        const striker = battingTeam.players[innings.currentStriker];
        const bowler = bowlingTeam.players[innings.currentBowler];

        // Snapshot for undo
        const ballEntry = {
          runs: 0,
          extras: 0,
          extraType: '',
          isWicket: false,
          wicketType: '',
          batsmanIndex: innings.currentStriker,
          bowlerIndex: innings.currentBowler,
          isLegal: true,
          strikerBefore: innings.currentStriker,
          nonStrikerBefore: innings.currentNonStriker,
          timestamp: new Date()
        };

        // ---- PROCESS ACTION ----
        switch (action) {
          case 'run': {
            const runs = value || 0;
            ballEntry.runs = runs;

            striker.batting.runs += runs;
            striker.batting.balls += 1;
            if (runs === 4) striker.batting.fours += 1;
            if (runs === 6) striker.batting.sixes += 1;

            bowler.bowling.balls += 1;
            bowler.bowling.runsConceded += runs;

            innings.totalRuns += runs;
            innings.totalBalls += 1;

            // Odd runs → swap strike
            if (runs % 2 !== 0) {
              const temp = innings.currentStriker;
              innings.currentStriker = innings.currentNonStriker;
              innings.currentNonStriker = temp;
            }
            break;
          }

          case 'wide': {
            const wideRuns = value || 1;
            ballEntry.extras = wideRuns;
            ballEntry.extraType = 'wide';
            ballEntry.isLegal = false;

            innings.extras.wides += wideRuns;
            innings.extras.total += wideRuns;
            innings.totalRuns += wideRuns;

            bowler.bowling.runsConceded += wideRuns;
            bowler.bowling.wides += 1;
            break;
          }

          case 'noball': {
            const nbRuns = value || 1;
            ballEntry.extras = nbRuns;
            ballEntry.extraType = 'noball';
            ballEntry.isLegal = false;

            innings.extras.noBalls += nbRuns;
            innings.extras.total += nbRuns;
            innings.totalRuns += nbRuns;

            bowler.bowling.runsConceded += nbRuns;
            bowler.bowling.noBalls += 1;
            break;
          }

          case 'wicket': {
            const wicketType = (value && value.type) ? value.type : 'bowled';
            ballEntry.isWicket = true;
            ballEntry.wicketType = wicketType;

            striker.batting.isOut = true;
            striker.batting.howOut = wicketType;
            striker.batting.balls += 1;

            bowler.bowling.balls += 1;
            if (wicketType !== 'runout') {
              bowler.bowling.wickets += 1;
            }

            innings.totalWickets += 1;
            innings.totalBalls += 1;
            break;
          }

          default:
            return socket.emit('error', { message: `Unknown action: ${action}` });
        }

        // Push ball to log
        innings.ballLog.push(ballEntry);

        // ---- CHECK OVER COMPLETE ----
        let overCompleted = false;
        if (ballEntry.isLegal && innings.totalBalls > 0 && innings.totalBalls % 6 === 0) {
          overCompleted = true;
          // Swap strike at end of over
          const temp = innings.currentStriker;
          innings.currentStriker = innings.currentNonStriker;
          innings.currentNonStriker = temp;
        }

        // ---- CHECK INNINGS COMPLETE ----
        if (checkInningsComplete(match, innings)) {
          innings.isCompleted = true;

          if (match.currentInnings === 0) {
            // First innings over → prepare second
            match.status = 'innings_break';
            match.currentInnings = 1;

            match.innings.push({
              battingTeamIndex: innings.bowlingTeamIndex,
              bowlingTeamIndex: innings.battingTeamIndex,
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
            });

            await match.save();
            io.to(matchCode).emit('match-state', { match: match.toObject() });
            io.to(matchCode).emit('innings-ended', {
              inningsNumber: 1,
              totalRuns: innings.totalRuns,
              totalWickets: innings.totalWickets,
              totalBalls: innings.totalBalls,
              target: innings.totalRuns + 1
            });
            return;

          } else {
            // Second innings over → match complete
            match.status = 'completed';
            match.result = getMatchResult(match);
            await match.save();
            await persistMatchStats(match);

            io.to(matchCode).emit('match-state', { match: match.toObject() });
            io.to(matchCode).emit('match-completed', {
              result: match.result,
              match: match.toObject()
            });
            return;
          }
        }

        // If wicket fell but innings continues → need new batsman
        if (action === 'wicket') {
          innings.needsBatsmanSelection = true;
        }

        // If over completed but innings continues → need new bowler
        if (overCompleted && !innings.isCompleted) {
          innings.needsBowlerSelection = true;
        }

        await match.save();

        io.to(matchCode).emit('score-updated', {
          match: match.toObject(),
          lastBall: ballEntry,
          overCompleted
        });

      } catch (err) {
        console.error('update-score error:', err);
        socket.emit('error', { message: 'Failed to update score' });
      }
    });

    // ------------------------------------------
    // SELECT BATSMAN — after wicket
    // ------------------------------------------
    socket.on('select-batsman', async ({ matchCode, playerIndex }) => {
      try {
        const match = await Match.findOne({ matchCode });
        if (!match || !isActiveScorer(match, socket.id)) return;

        const innings = getCurrentInnings(match);
        if (!innings) return;

        innings.currentStriker = playerIndex;
        innings.needsBatsmanSelection = false;
        await match.save();

        io.to(matchCode).emit('match-state', { match: match.toObject() });
      } catch (err) {
        console.error('select-batsman error:', err);
      }
    });

    // ------------------------------------------
    // SELECT BOWLER — after over
    // ------------------------------------------
    socket.on('select-bowler', async ({ matchCode, playerIndex }) => {
      try {
        const match = await Match.findOne({ matchCode });
        if (!match || !isActiveScorer(match, socket.id)) return;

        const innings = getCurrentInnings(match);
        if (!innings) return;

        innings.currentBowler = playerIndex;
        innings.needsBowlerSelection = false;
        await match.save();

        io.to(matchCode).emit('match-state', { match: match.toObject() });
      } catch (err) {
        console.error('select-bowler error:', err);
      }
    });

    // ------------------------------------------
    // UNDO LAST BALL
    // ------------------------------------------
    socket.on('undo-ball', async ({ matchCode }) => {
      try {
        const match = await Match.findOne({ matchCode });
        if (!match || !isActiveScorer(match, socket.id)) return;

        const innings = getCurrentInnings(match);
        if (!innings || innings.ballLog.length === 0) return;

        const last = innings.ballLog.pop();
        const battingTeam = match.teams[innings.battingTeamIndex];
        const bowlingTeam = match.teams[innings.bowlingTeamIndex];
        const batsman = battingTeam.players[last.batsmanIndex];
        const bowler = bowlingTeam.players[last.bowlerIndex];

        // Reverse batsman stats
        batsman.batting.runs -= last.runs;
        if (last.isLegal || last.isWicket) batsman.batting.balls -= 1;
        if (last.runs === 4) batsman.batting.fours -= 1;
        if (last.runs === 6) batsman.batting.sixes -= 1;

        // Reverse bowler stats
        if (last.isLegal) bowler.bowling.balls -= 1;
        bowler.bowling.runsConceded -= (last.runs + last.extras);

        if (last.extraType === 'wide') {
          innings.extras.wides -= last.extras;
          innings.extras.total -= last.extras;
          bowler.bowling.wides -= 1;
        }
        if (last.extraType === 'noball') {
          innings.extras.noBalls -= last.extras;
          innings.extras.total -= last.extras;
          bowler.bowling.noBalls -= 1;
        }

        // Reverse innings totals
        innings.totalRuns -= (last.runs + last.extras);
        if (last.isLegal) innings.totalBalls -= 1;

        // Reverse wicket
        if (last.isWicket) {
          batsman.batting.isOut = false;
          batsman.batting.howOut = '';
          innings.totalWickets -= 1;
          if (last.wicketType !== 'runout') bowler.bowling.wickets -= 1;
        }

        // Restore striker/non-striker from snapshot
        innings.currentStriker = last.strikerBefore;
        innings.currentNonStriker = last.nonStrikerBefore;
        innings.currentBowler = last.bowlerIndex;
        innings.needsBatsmanSelection = false;
        innings.needsBowlerSelection = false;

        await match.save();
        io.to(matchCode).emit('match-state', { match: match.toObject() });
        io.to(matchCode).emit('ball-undone', { message: 'Last ball undone' });
      } catch (err) {
        console.error('undo-ball error:', err);
      }
    });

    // ------------------------------------------
    // HOST RECLAIM CONTROL
    // ------------------------------------------
    socket.on('host-reclaim', async ({ matchCode }) => {
      try {
        const match = await Match.findOne({ matchCode });
        if (!match || match.hostSessionId !== socket.sessionId) return;

        match.activeScorer = 'host';
        match.hostSocketId = socket.id;
        await match.save();

        io.to(matchCode).emit('scorer-changed', {
          activeScorer: 'host',
          message: 'Host has reclaimed scoring control'
        });
        io.to(matchCode).emit('match-state', { match: match.toObject() });
      } catch (err) {
        console.error('host-reclaim error:', err);
      }
    });

    // ------------------------------------------
    // END INNINGS MANUALLY
    // ------------------------------------------
    socket.on('end-innings', async ({ matchCode }) => {
      try {
        const match = await Match.findOne({ matchCode });
        if (!match || !isActiveScorer(match, socket.id)) return;

        const innings = getCurrentInnings(match);
        if (!innings) return;

        innings.isCompleted = true;

        if (match.currentInnings === 0) {
          match.status = 'innings_break';
          match.currentInnings = 1;

          match.innings.push({
            battingTeamIndex: innings.bowlingTeamIndex,
            bowlingTeamIndex: innings.battingTeamIndex,
            totalRuns: 0, totalWickets: 0, totalBalls: 0,
            extras: { wides: 0, noBalls: 0, total: 0 },
            currentStriker: -1, currentNonStriker: -1, currentBowler: -1,
            needsBatsmanSelection: true, needsBowlerSelection: true,
            ballLog: [], isCompleted: false
          });

          await match.save();
          io.to(matchCode).emit('match-state', { match: match.toObject() });
          io.to(matchCode).emit('innings-ended', {
            inningsNumber: 1,
            totalRuns: innings.totalRuns,
            target: innings.totalRuns + 1
          });
        } else {
          match.status = 'completed';
          match.result = getMatchResult(match);
          await match.save();
          await persistMatchStats(match);

          io.to(matchCode).emit('match-state', { match: match.toObject() });
          io.to(matchCode).emit('match-completed', {
            result: match.result, match: match.toObject()
          });
        }
      } catch (err) {
        console.error('end-innings error:', err);
      }
    });

    // ------------------------------------------
    // GET VIEWERS LIST (for co-host assignment)
    // ------------------------------------------
    socket.on('get-viewers', async ({ matchCode }) => {
      try {
        const room = io.sockets.adapter.rooms.get(matchCode);
        if (!room) return;

        const match = await Match.findOne({ matchCode });
        if (!match) return;

        const viewers = [];
        for (const sid of room) {
          if (sid !== match.hostSocketId && sid !== match.coHostSocketId) {
            viewers.push({ socketId: sid });
          }
        }
        socket.emit('viewers-list', { viewers });
      } catch (err) {
        console.error('get-viewers error:', err);
      }
    });

    // ------------------------------------------
    // DISCONNECT
    // ------------------------------------------
    socket.on('disconnect', async () => {
      console.log(`💔 Disconnected: ${socket.id}`);
      if (!socket.matchCode) return;

      try {
        const match = await Match.findOne({ matchCode: socket.matchCode });
        if (!match) return;

        // Host disconnected
        if (match.hostSocketId === socket.id) {
          match.hostSocketId = null;

          if (match.coHostSocketId) {
            // Promote co-host
            match.activeScorer = 'cohost';
            await match.save();
            io.to(socket.matchCode).emit('scorer-changed', {
              activeScorer: 'cohost',
              message: 'Host disconnected. Co-Host is now scoring.'
            });
          } else {
            await match.save();
            io.to(socket.matchCode).emit('host-disconnected', {
              message: 'Host disconnected. Waiting for reconnection...'
            });
          }
        }
        // Co-host disconnected
        else if (match.coHostSocketId === socket.id) {
          match.coHostSocketId = null;
          if (match.activeScorer === 'cohost') match.activeScorer = 'host';
          await match.save();
          io.to(socket.matchCode).emit('cohost-disconnected', {
            message: 'Co-Host disconnected.'
          });
        }

        // Update viewer count
        const room = io.sockets.adapter.rooms.get(socket.matchCode);
        io.to(socket.matchCode).emit('viewer-count', {
          count: room ? room.size : 0
        });
      } catch (err) {
        console.error('disconnect error:', err);
      }
    });
  });
};
