import { Server, Socket } from 'socket.io';
import { GameEngine, PlayerAction } from '../game/GameEngine';
import { StateSanitizer } from './StateSanitizer';
import {
  ClientEvents,
  ServerEvents,
  JoinGamePayload,
  PlayCardPayload,
  EndTurnPayload,
  SelectTargetPayload,
  SelectPaymentPayload,
  ReactToActionPayload,
  MoveWildcardPayload,
  DiscardCardsPayload,
  GameStateUpdatePayload,
  PlayerJoinedPayload,
  ErrorPayload,
  PlayerDisconnectedPayload,
  PlayerReconnectedPayload,
  ActionRequiresTargetPayload,
  ReactionPromptPayload,
} from 'shared';

/**
 * SocketManager - Manages Socket.IO connections and game events
 * Phase 4: Networking & Real-Time Sync
 * 
 * Wraps GameEngine with Socket.IO communication layer
 * Handles player connections, disconnections, and game actions
 */
export class SocketManager {
  private io: Server;
  private gameEngine: GameEngine;
  private playerSockets: Map<string, Socket>; // playerId -> socket
  private socketToPlayer: Map<string, string>; // socket.id -> playerId
  private playerNames: Map<string, string>; // playerId -> playerName
  private disconnectedPlayers: Map<string, NodeJS.Timeout>; // playerId -> timeout

  constructor(io: Server, gameEngine: GameEngine) {
    this.io = io;
    this.gameEngine = gameEngine;
    this.playerSockets = new Map();
    this.socketToPlayer = new Map();
    this.playerNames = new Map();
    this.disconnectedPlayers = new Map();
    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Register event handlers for this socket
      socket.on(ClientEvents.JOIN_GAME, (data: JoinGamePayload) =>
        this.handleJoinGame(socket, data)
      );

      socket.on(ClientEvents.START_GAME, () =>
        this.handleStartGame(socket)
      );

      socket.on(ClientEvents.PLAY_CARD, (data: PlayCardPayload) =>
        this.handlePlayCard(socket, data)
      );

      socket.on(ClientEvents.END_TURN, (data: EndTurnPayload) => 
        this.handleEndTurn(socket, data)
      );

      socket.on(ClientEvents.SELECT_TARGET, (data: SelectTargetPayload) => 
        this.handleSelectTarget(socket, data)
      );

      socket.on(ClientEvents.SELECT_PAYMENT, (data: SelectPaymentPayload) => 
        this.handleSelectPayment(socket, data)
      );

      socket.on(ClientEvents.REACT_TO_ACTION, (data: ReactToActionPayload) => 
        this.handleReactToAction(socket, data)
      );

      socket.on(ClientEvents.MOVE_WILDCARD, (data: MoveWildcardPayload) => 
        this.handleMoveWildcard(socket, data)
      );

      socket.on(ClientEvents.DISCARD_CARDS, (data: DiscardCardsPayload) => 
        this.handleDiscardCards(socket, data)
      );

      socket.on('disconnect', () => 
        this.handleDisconnect(socket)
      );
    });
  }

  /**
   * Handle player joining the game
   */
  private handleJoinGame(socket: Socket, data: JoinGamePayload): void {
    try {
      const { playerName } = data;

      if (!playerName || playerName.trim().length === 0) {
        this.sendError(socket, 'Player name is required');
        return;
      }

      // Use socket.id as player ID
      const playerId = socket.id;

      // Store socket mapping and player name
      this.playerSockets.set(playerId, socket);
      this.socketToPlayer.set(socket.id, playerId);
      this.playerNames.set(playerId, playerName);

      // Check if this is a reconnection
      if (this.disconnectedPlayers.has(playerId)) {
        clearTimeout(this.disconnectedPlayers.get(playerId)!);
        this.disconnectedPlayers.delete(playerId);
        
        // Notify reconnection
        const payload: PlayerReconnectedPayload = {
          playerId,
          playerName,
        };
        this.io.emit(ServerEvents.PLAYER_RECONNECTED, payload);
        
        console.log(`Player reconnected: ${playerName} (${playerId})`);
        
        // Broadcast game state for reconnection (game already initialized)
        this.broadcastGameState();
      } else {
        // New player joining lobby
        console.log(`Player joined: ${playerName} (${playerId})`);
        
        // Send join confirmation to all players
        const joinPayload: PlayerJoinedPayload = {
          playerId,
          playerName,
          playerCount: this.playerSockets.size,
        };
        this.io.emit(ServerEvents.PLAYER_JOINED, joinPayload);
        
        // If game is already in progress, send current state to new player
        if (this.gameEngine.isGameInProgress()) {
          this.broadcastGameState();
        }
      }

    } catch (error) {
      console.error('Error handling join game:', error);
      this.sendError(socket, 'Failed to join game');
    }
  }

  /**
   * Handle starting the game
   */
  private handleStartGame(socket: Socket): void {
    try {
      const playerId = this.socketToPlayer.get(socket.id);
      
      if (!playerId) {
        this.sendError(socket, 'Player not found');
        return;
      }

      // Check if game can be started (minimum 2 players)
      if (this.playerSockets.size < 2) {
        this.sendError(socket, 'Need at least 2 players to start');
        return;
      }

      // Check if game already started
      if (this.gameEngine.isGameInProgress()) {
        this.sendError(socket, 'Game already in progress');
        return;
      }

      // Initialize game with all connected player IDs and names
      const playerIds = Array.from(this.playerSockets.keys());
      const playerNamesList = playerIds.map(id => this.playerNames.get(id) || 'Unknown');
      this.gameEngine.initializeGame(playerIds, playerNamesList);

      console.log(`Game started by ${playerId} with ${playerIds.length} players`);

      // Broadcast updated game state to all players
      this.broadcastGameState();

    } catch (error) {
      console.error('Error starting game:', error);
      this.sendError(socket, 'Failed to start game');
    }
  }

  /**
   * Handle playing a card
   */
  private handlePlayCard(socket: Socket, data: PlayCardPayload): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) {
      this.sendError(socket, 'Player not found');
      return;
    }

    try {
      const action: PlayerAction = {
        type: 'PLAY_CARD',
        playerId,
        cardId: data.cardId,
        data: { targetColor: data.targetColor },
      };

      const result = this.gameEngine.processAction(action);

      if (!result.success) {
        this.sendError(socket, result.message);
        return;
      }

      // Broadcast updated state
      this.broadcastGameState();

    } catch (error) {
      console.error('Error handling play card:', error);
      this.sendError(socket, 'Failed to play card');
    }
  }

  /**
   * Handle ending turn
   */
  private handleEndTurn(socket: Socket, data: EndTurnPayload): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) {
      this.sendError(socket, 'Player not found');
      return;
    }

    try {
      const action: PlayerAction = {
        type: 'END_TURN',
        playerId,
      };

      const result = this.gameEngine.processAction(action);

      if (!result.success) {
        this.sendError(socket, result.message);
        return;
      }

      // Broadcast updated state
      this.broadcastGameState();

    } catch (error) {
      console.error('Error handling end turn:', error);
      this.sendError(socket, 'Failed to end turn');
    }
  }

  /**
   * Handle target selection (for action cards)
   */
  private handleSelectTarget(socket: Socket, data: SelectTargetPayload): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) {
      this.sendError(socket, 'Player not found');
      return;
    }

    try {
      console.log(`Target selected by ${playerId}:`, data);
      
      // Complete the target selection in game engine
      const result = this.gameEngine.completeTargetSelection(
        data.targetPlayerId,
        {
          propertyColor: data.propertyColor,
          propertyCardId: data.propertyCardId,
          myPropertyCardId: data.myPropertyCardId,
          theirPropertyCardId: data.theirPropertyCardId
        }
      );

      if (!result.success) {
        this.sendError(socket, result.message);
        return;
      }

      // Broadcast updated state to all players
      this.broadcastGameState();

    } catch (error) {
      console.error('Error handling target selection:', error);
      this.sendError(socket, 'Failed to select target');
    }
  }

  /**
   * Handle payment selection
   */
  private handleSelectPayment(socket: Socket, data: SelectPaymentPayload): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) {
      this.sendError(socket, 'Player not found');
      return;
    }

    try {
      // This will be implemented in Phase 5 with payment handler
      console.log(`Payment selected by ${playerId}:`, data);
      this.sendError(socket, 'Payment selection not yet implemented');
    } catch (error) {
      console.error('Error handling payment selection:', error);
      this.sendError(socket, 'Failed to select payment');
    }
  }

  /**
   * Handle reaction to action (Just Say No)
   */
  private handleReactToAction(socket: Socket, data: ReactToActionPayload): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) {
      this.sendError(socket, 'Player not found');
      return;
    }

    try {
      // This will be implemented in Phase 5 with reaction handler
      console.log(`Reaction from ${playerId}:`, data);
      this.sendError(socket, 'Reactions not yet implemented');
    } catch (error) {
      console.error('Error handling reaction:', error);
      this.sendError(socket, 'Failed to react to action');
    }
  }

  /**
   * Handle wildcard movement
   */
  private handleMoveWildcard(socket: Socket, data: MoveWildcardPayload): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) {
      this.sendError(socket, 'Player not found');
      return;
    }

    try {
      const result = this.gameEngine.moveWildcard(
        playerId,
        data.cardId,
        data.toColor
      );

      if (!result.success) {
        this.sendError(socket, result.message);
        return;
      }

      // Broadcast updated state
      this.broadcastGameState();

    } catch (error) {
      console.error('Error handling wildcard move:', error);
      this.sendError(socket, 'Failed to move wildcard');
    }
  }

  /**
   * Handle discarding cards
   */
  private handleDiscardCards(socket: Socket, data: DiscardCardsPayload): void {
    const playerId = this.socketToPlayer.get(socket.id);
    if (!playerId) {
      this.sendError(socket, 'Player not found');
      return;
    }

    try {
      const result = this.gameEngine.discardCards(playerId, data.cardIds);

      if (!result.success) {
        this.sendError(socket, result.message);
        return;
      }

      // Broadcast updated state
      this.broadcastGameState();

    } catch (error) {
      console.error('Error handling discard:', error);
      this.sendError(socket, 'Failed to discard cards');
    }
  }

  /**
   * Handle player disconnection
   */
  private handleDisconnect(socket: Socket): void {
    const playerId = this.socketToPlayer.get(socket.id);
    
    if (!playerId) {
      console.log(`Unknown client disconnected: ${socket.id}`);
      return;
    }

    console.log(`Player disconnected: ${playerId}`);

    // Set timeout for reconnection (30 seconds)
    const timeout = setTimeout(() => {
      // Player didn't reconnect, remove from game
      this.playerSockets.delete(playerId);
      this.socketToPlayer.delete(socket.id);
      this.disconnectedPlayers.delete(playerId);

      const payload: PlayerDisconnectedPayload = {
        playerId,
        playerName: playerId, // Would need to store player name separately
      };
      this.io.emit(ServerEvents.PLAYER_DISCONNECTED, payload);

      console.log(`Player removed after timeout: ${playerId}`);
    }, 30000); // 30 second timeout

    this.disconnectedPlayers.set(playerId, timeout);
  }

  /**
   * Broadcast game state to all connected players
   */
  public broadcastGameState(): void {
    const gameState = this.gameEngine.getGameState();

    // Check if we need to emit special events based on game phase
    if (gameState.phase === 'AWAITING_TARGET' && gameState.pendingAction) {
      // Emit ACTION_REQUIRES_TARGET event to the initiator
      const initiatorSocket = this.playerSockets.get(gameState.pendingAction.initiatorId);
      if (initiatorSocket) {
        const opponents = gameState.players.filter(p => p.id !== gameState.pendingAction!.initiatorId);
        const payload: ActionRequiresTargetPayload = {
          actionType: gameState.pendingAction.actionType || 'UNKNOWN',
          validTargets: opponents.map(p => p.id),
          requiresPropertySelection: false // Can be enhanced later for property-specific actions
        };
        initiatorSocket.emit(ServerEvents.ACTION_REQUIRES_TARGET, payload);
        console.log(`Emitted ACTION_REQUIRES_TARGET to ${gameState.pendingAction.initiatorId}`);
      }
    }

    // Check if we need to emit REACTION_PROMPT for AWAITING_REACTION phase
    if (gameState.phase === 'AWAITING_REACTION' && gameState.pendingAction) {
      const targetSocket = this.playerSockets.get(gameState.pendingAction.targetId!);
      if (targetSocket) {
        // Check if target has Just Say No card
        const targetPlayer = gameState.players.find(p => p.id === gameState.pendingAction!.targetId);
        const hasJustSayNo = targetPlayer?.hand.some(card =>
          card.category === 'ACTION' && (card as any).actionType === 'JUST_SAY_NO'
        ) || false;

        const payload: ReactionPromptPayload = {
          actionType: gameState.pendingAction.actionType || 'PAYMENT',
          initiatorId: gameState.pendingAction.initiatorId,
          targetId: gameState.pendingAction.targetId!,
          canCounter: hasJustSayNo,
          timeoutSeconds: 30
        };
        targetSocket.emit(ServerEvents.REACTION_PROMPT, payload);
        console.log(`Emitted REACTION_PROMPT to ${gameState.pendingAction.targetId}`);
      }
    }

    // Broadcast sanitized state to all players
    for (const [playerId, socket] of this.playerSockets) {
      const sanitizedState = StateSanitizer.sanitizeForPlayer(gameState, playerId);
      
      const payload: GameStateUpdatePayload = {
        state: sanitizedState,
      };

      socket.emit(ServerEvents.GAME_STATE_UPDATE, payload);
    }
  }

  /**
   * Send error message to specific socket
   */
  private sendError(socket: Socket, message: string): void {
    const payload: ErrorPayload = {
      message,
    };
    socket.emit(ServerEvents.ERROR, payload);
  }

  /**
   * Get number of connected players
   */
  public getPlayerCount(): number {
    return this.playerSockets.size;
  }

  /**
   * Check if a player is connected
   */
  public isPlayerConnected(playerId: string): boolean {
    return this.playerSockets.has(playerId);
  }
}

// Made with Bob