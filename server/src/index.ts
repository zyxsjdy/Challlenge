import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { GameEngine } from './game/GameEngine';

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
 * Connected players tracking
 */
const connectedPlayers = new Map<string, { socketId: string; name: string }>();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    gameInProgress: gameEngine.isGameInProgress(),
    connectedPlayers: connectedPlayers.size
  });
});

/**
 * Socket.IO connection handling
 */
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  /**
   * Player joins the game
   */
  socket.on('join-game', (data: { playerName: string }) => {
    const { playerName } = data;
    
    if (!playerName) {
      socket.emit('error', { message: 'Player name is required' });
      return;
    }

    // Add player to connected players
    connectedPlayers.set(socket.id, {
      socketId: socket.id,
      name: playerName
    });

    console.log(`Player joined: ${playerName} (${socket.id})`);

    // Notify all clients about player join
    io.emit('player-joined', {
      playerName,
      totalPlayers: connectedPlayers.size
    });

    // Send current game state to the joining player
    if (gameEngine.isGameInProgress()) {
      const sanitizedState = gameEngine.getSanitizedState(socket.id);
      socket.emit('game-state', sanitizedState);
    }
  });

  /**
   * Start game (when enough players have joined)
   */
  socket.on('start-game', () => {
    if (connectedPlayers.size < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    if (connectedPlayers.size > 5) {
      socket.emit('error', { message: 'Maximum 5 players allowed' });
      return;
    }

    if (gameEngine.isGameInProgress()) {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    try {
      // Get player names in order of connection
      const playerNames = Array.from(connectedPlayers.values()).map(p => p.name);
      
      // Initialize game
      gameEngine.initializeGame(playerNames);

      console.log('Game started with players:', playerNames);

      // Send initial game state to all players
      for (const [socketId] of connectedPlayers) {
        const sanitizedState = gameEngine.getSanitizedState(socketId);
        io.to(socketId).emit('game-started', sanitizedState);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start game';
      socket.emit('error', { message: errorMessage });
      console.error('Error starting game:', error);
    }
  });

  /**
   * Player action (play card, end turn, etc.)
   */
  socket.on('player-action', (action: any) => {
    if (!gameEngine.isGameInProgress()) {
      socket.emit('error', { message: 'No game in progress' });
      return;
    }

    try {
      // Add socket ID as player ID
      action.playerId = socket.id;

      // Process action
      const result = gameEngine.processAction(action);

      if (result.success) {
        // Broadcast updated state to all players
        for (const [socketId] of connectedPlayers) {
          const sanitizedState = gameEngine.getSanitizedState(socketId);
          io.to(socketId).emit('game-state', sanitizedState);
        }

        // Send action result to the acting player
        socket.emit('action-result', {
          success: true,
          message: result.message
        });
      } else {
        // Send error to the acting player
        socket.emit('action-result', {
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process action';
      socket.emit('error', { message: errorMessage });
      console.error('Error processing action:', error);
    }
  });

  /**
   * Player disconnects
   */
  socket.on('disconnect', () => {
    const player = connectedPlayers.get(socket.id);
    
    if (player) {
      console.log(`Player disconnected: ${player.name} (${socket.id})`);
      connectedPlayers.delete(socket.id);

      // Notify other players
      io.emit('player-left', {
        playerName: player.name,
        totalPlayers: connectedPlayers.size
      });

      // If game was in progress, handle disconnection
      if (gameEngine.isGameInProgress()) {
        // TODO: Implement game pause/forfeit logic in Phase 3
        console.log('Game interrupted by player disconnect');
      }
    }
  });

  /**
   * Get current game state
   */
  socket.on('get-game-state', () => {
    if (gameEngine.isGameInProgress()) {
      const sanitizedState = gameEngine.getSanitizedState(socket.id);
      socket.emit('game-state', sanitizedState);
    } else {
      socket.emit('game-state', null);
    }
  });
});

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