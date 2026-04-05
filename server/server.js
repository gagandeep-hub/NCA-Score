const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const matchRoutes = require('./routes/matchRoutes');
const playerRoutes = require('./routes/playerRoutes');
const socketHandler = require('./socket/socketHandler');

// ===== INIT EXPRESS =====
const app = express();
const server = http.createServer(app);

// ===== INIT SOCKET.IO =====
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT']
  }
});

// ===== MIDDLEWARE =====
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));
app.use(express.json());

// ===== REST ROUTES =====
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes); // Re-mounted to fix leaderboard/stats pages

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== SOCKET.IO =====
socketHandler(io);

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🏏 Cricket Scorer Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
  });
});
