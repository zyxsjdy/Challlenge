import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { GameEngine } from './game/GameEngine';
import { SocketManager } from './network/SocketManager';

/**
 * Server configuration
 */
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * Initialize Express app
 */
const app = express();
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json());

/**
 * Create HTTP server
 */
const httpServer = createServer(app);

/**
 * Initialize Socket.IO with CORS for LAN access
 */
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

/**
 * Game Engine instance
 */
const gameEngine = new GameEngine();

/**
 * Socket Manager instance - handles all Socket.IO events
 */
const socketManager = new SocketManager(io, gameEngine);

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    gameInProgress: gameEngine.isGameInProgress(),
    connectedPlayers: socketManager.getPlayerCount()
  });
});

/**
 * Get server info endpoint (for LAN discovery)
 */
app.get('/info', (req, res) => {
  res.json({
    serverName: 'Monopoly Deal Server',
    version: '1.0.0',
    maxPlayers: 5,
    currentPlayers: socketManager.getPlayerCount()
  });
});

// Note: All Socket.IO event handling is now managed by SocketManager

/**
 * Start server
 */
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Accepting connections from: ${CLIENT_URL}`);
  console.log('Waiting for players to join...');
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Made with Bob