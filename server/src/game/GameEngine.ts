import { GameState, Player, Card } from 'shared';
import { GamePhase } from 'shared';
import { CardFactory } from './CardFactory';

/**
 * PlayerAction - Represents an action a player wants to take
 */
export interface PlayerAction {
  type: 'PLAY_CARD' | 'END_TURN' | 'DRAW_CARDS' | 'RESPOND';
  playerId: string;
  cardId?: string;
  targetPlayerId?: string;
  data?: any;
}

/**
 * ActionResult - Result of processing a player action
 */
export interface ActionResult {
  success: boolean;
  message: string;
  newState?: GameState;
  error?: string;
}

/**
 * GameEngine - Core game logic and state management
 * Handles game initialization, turn management, and action processing
 */
export class GameEngine {
  private gameState: GameState;
  private deck: Card[];

  constructor() {
    this.gameState = new GameState();
    this.deck = [];
  }

  /**
   * Initialize the game with player names
   * Loads deck, shuffles, and deals initial hands
   */
  initializeGame(playerNames: string[]): void {
    if (playerNames.length < 2) {
      throw new Error('Need at least 2 players to start');
    }
    if (playerNames.length > 5) {
      throw new Error('Maximum 5 players allowed');
    }

    // Create Player instances
    for (let i = 0; i < playerNames.length; i++) {
      const player = new Player(`player-${i}`, playerNames[i]);
      this.gameState.addPlayer(player);
    }

    // Load and shuffle deck
    this.deck = CardFactory.createDeck();
    this.gameState.initializeDeck(this.deck);
    this.gameState.shuffleDeck();

    // Deal initial hands (5 cards each)
    this.gameState.dealInitialHands();

    // Set game phase to playing
    this.gameState.phase = GamePhase.PLAYING;

    console.log(`Game initialized with ${playerNames.length} players`);
    console.log(`Deck size: ${this.gameState.drawPile.length} cards`);
  }

  /**
   * Process a player action
   * Validates action and updates game state accordingly
   */
  processAction(action: PlayerAction): ActionResult {
    try {
      // Validate it's the player's turn
      const currentPlayer = this.gameState.getCurrentPlayer();
      if (action.playerId !== currentPlayer.id) {
        return {
          success: false,
          message: 'Not your turn',
          error: 'NOT_YOUR_TURN'
        };
      }

      // Process action based on type
      switch (action.type) {
        case 'PLAY_CARD':
          return this.handlePlayCard(action);
        
        case 'END_TURN':
          return this.handleEndTurn(action);
        
        case 'DRAW_CARDS':
          return this.handleDrawCards(action);
        
        case 'RESPOND':
          return this.handleRespond(action);
        
        default:
          return {
            success: false,
            message: 'Unknown action type',
            error: 'UNKNOWN_ACTION'
          };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: 'PROCESSING_ERROR'
      };
    }
  }

  /**
   * Handle playing a card from hand
   */
  private handlePlayCard(action: PlayerAction): ActionResult {
    if (!action.cardId) {
      return {
        success: false,
        message: 'No card specified',
        error: 'NO_CARD_ID'
      };
    }

    const currentPlayer = this.gameState.getCurrentPlayer();
    const card = currentPlayer.hand.find(c => c.id === action.cardId);

    if (!card) {
      return {
        success: false,
        message: 'Card not in hand',
        error: 'CARD_NOT_FOUND'
      };
    }

    // Check 3-card play limit (Just Say No doesn't count)
    if (this.gameState.turnPlayCount >= 3) {
      return {
        success: false,
        message: 'Already played 3 cards this turn',
        error: 'PLAY_LIMIT_REACHED'
      };
    }

    // TODO: Implement specific card play logic based on card type
    // For now, just increment play count
    this.gameState.turnPlayCount++;

    return {
      success: true,
      message: 'Card played successfully',
      newState: this.gameState
    };
  }

  /**
   * Handle ending the current player's turn
   */
  private handleEndTurn(action: PlayerAction): ActionResult {
    // Check if there are pending actions
    if (this.gameState.pendingAction) {
      return {
        success: false,
        message: 'Cannot end turn with pending actions',
        error: 'PENDING_ACTION'
      };
    }

    // Check win condition before advancing turn
    const winner = this.gameState.checkWinCondition();
    if (winner) {
      return {
        success: true,
        message: `${winner.name} wins!`,
        newState: this.gameState
      };
    }

    // Advance to next turn
    this.gameState.nextTurn();

    return {
      success: true,
      message: 'Turn ended',
      newState: this.gameState
    };
  }

  /**
   * Handle drawing cards (for Pass Go or turn start)
   */
  private handleDrawCards(action: PlayerAction): ActionResult {
    const currentPlayer = this.gameState.getCurrentPlayer();
    const count = action.data?.count || 2;

    this.gameState.drawCards(currentPlayer, count);

    return {
      success: true,
      message: `Drew ${count} cards`,
      newState: this.gameState
    };
  }

  /**
   * Handle player response to pending action (payment, reaction, etc.)
   */
  private handleRespond(action: PlayerAction): ActionResult {
    if (!this.gameState.pendingAction) {
      return {
        success: false,
        message: 'No pending action to respond to',
        error: 'NO_PENDING_ACTION'
      };
    }

    // TODO: Implement response handling logic
    // This will be expanded in Phase 5 for action cards and interrupts

    return {
      success: true,
      message: 'Response processed',
      newState: this.gameState
    };
  }

  /**
   * Get current game state
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Get sanitized game state for a specific player
   */
  getSanitizedState(playerId: string): any {
    return this.gameState.sanitizeForPlayer(playerId);
  }

  /**
   * Check if game is in progress
   */
  isGameInProgress(): boolean {
    return this.gameState.phase === GamePhase.PLAYING ||
           this.gameState.phase === GamePhase.AWAITING_TARGET ||
           this.gameState.phase === GamePhase.AWAITING_PAYMENT ||
           this.gameState.phase === GamePhase.AWAITING_REACTION;
  }

  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.gameState.phase === GamePhase.GAME_OVER;
  }

  /**
   * Get winner if game is over
   */
  getWinner(): Player | null {
    return this.gameState.winner;
  }

  /**
   * Reset game state for a new game
   */
  resetGame(): void {
    this.gameState = new GameState();
    this.deck = [];
  }
}

// Made with Bob