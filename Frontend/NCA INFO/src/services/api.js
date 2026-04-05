import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// ===== MATCH ENDPOINTS =====

export const createMatch = (totalOvers = 20) =>
  api.post('/matches', { totalOvers });

export const getMatch = (matchCode) =>
  api.get(`/matches/${matchCode}`);

export const saveTeams = (matchCode, teams) =>
  api.put(`/matches/${matchCode}/teams`, { teams });

export const saveToss = (matchCode, winner, decision) =>
  api.put(`/matches/${matchCode}/toss`, { winner, decision });

export const getMatchSummary = (matchCode) =>
  api.get(`/matches/${matchCode}/summary`);

export const getLeaderboard = () => api.get('/players/leaderboard');
export const getMatchHistory = () => api.get('/matches/history');
export const getAllPlayers = () => api.get('/players/all');

export default api;
