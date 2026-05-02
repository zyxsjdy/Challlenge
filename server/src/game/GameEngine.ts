import { GameState, Player, Card, PropertyCard, PropertyWildcard, ActionCard, RentCard } from 'shared';
import { GamePhase, CardCategory, PropertyColor } from 'shared';
import { CardFactory } from './CardFactory';
import { TurnManager } from './TurnManager';
import { WinCondition } from './WinCondition';

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
  private turnManager: TurnManager;
  private winCondition: WinCondition;

  constructor() {
    this.gameState = new GameState();
    this.deck = [];
    this.turnManager = new TurnManager();
    this.winCondition = new WinCondition();
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

    // Check 3-card play limit
    if (!this.turnManager.canPlayCard(this.gameState)) {
      return {
        success: false,
        message: 'Already played 3 cards this turn',
        error: 'PLAY_LIMIT_REACHED'
      };
    }

    // Route card based on type and placement
    try {
      this.playCard(currentPlayer.id, action.cardId, action.data);
      
      return {
        success: true,
        message: 'Card played successfully',
        newState: this.gameState
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to play card',
        error: 'PLAY_CARD_ERROR'
      };
    }
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

    // Use TurnManager to end turn (handles hand limit and win condition)
    this.turnManager.endTurn(this.gameState);

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

  /**
   * Play a card with routing logic based on card type
   * @param playerId Player playing the card
   * @param cardId Card to play
   * @param placement Placement data (color for properties, targets for actions, etc.)
   */
  private playCard(playerId: string, cardId: string, placement: any): void {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const card = player.hand.find(c => c.id === cardId);
    if (!card) {
      throw new Error('Card not in hand');
    }

    // Route card based on category
    if (card.category === CardCategory.MONEY) {
      this.routeToBank(player, card);
    } else if (card.category === CardCategory.PROPERTY) {
      const propCard = card as PropertyCard;
      this.routeToProperties(player, card, propCard.color);
    } else if (card.category === CardCategory.PROPERTY_WILDCARD) {
      const color = placement?.color;
      if (!color) {
        throw new Error('Must specify color for wildcard property');
      }
      this.routeToProperties(player, card, color);
    } else if (card.category === CardCategory.ACTION) {
      const useAsBank = placement?.useAsBank;
      if (useAsBank && card.monetaryValue > 0) {
        // Bank the action card (loses action ability)
        this.routeToBank(player, card);
      } else {
        // Execute action (placeholder for Phase 5)
        this.executeAction(player, card, placement);
        this.routeToDiscard(card);
      }
    } else if (card.category === CardCategory.RENT) {
      // Execute rent (placeholder for Phase 5)
      this.executeRent(player, card, placement);
      this.routeToDiscard(card);
    }

    // Increment play count (unless it's Just Say No or wildcard color change)
    this.gameState.turnPlayCount++;
  }

  /**
   * Route card to player's bank
   */
  private routeToBank(player: Player, card: Card): void {
    player.playToBank(card);
    console.log(`${player.name} banked ${card.name} ($${card.monetaryValue}M)`);
  }

  /**
   * Route card to player's property area
   */
  private routeToProperties(player: Player, card: Card, color: PropertyColor): void {
    player.playToProperties(card, color);
    console.log(`${player.name} played ${card.name} to ${color} properties`);
  }

  /**
   * Route card to discard pile
   */
  private routeToDiscard(card: Card): void {
    this.gameState.discardPile.push(card);
    console.log(`${card.name} discarded`);
  }

  /**
   * Execute action card (placeholder for Phase 5)
   */
  private executeAction(player: Player, card: Card, placement: any): void {
    const actionCard = card as ActionCard;
    console.log(`${player.name} played action: ${actionCard.name}`);
    // TODO: Implement action card logic in Phase 5
  }

  /**
   * Execute rent card (placeholder for Phase 5)
   */
  private executeRent(player: Player, card: Card, placement: any): void {
    const rentCard = card as RentCard;
    console.log(`${player.name} played rent: ${rentCard.name}`);
    // TODO: Implement rent logic in Phase 5
  }

  /**
   * Move wildcard between property sets (only during active turn)
   */
  moveWildcard(playerId: string, cardId: string, newColor: PropertyColor): ActionResult {
    const currentPlayer = this.gameState.getCurrentPlayer();
    
    // Validate it's the player's turn
    if (playerId !== currentPlayer.id) {
      return {
        success: false,
        message: 'Can only move wildcards during your turn',
        error: 'NOT_YOUR_TURN'
      };
    }

    // Find the wildcard in player's properties
    let foundCard: Card | null = null;
    let oldColor: PropertyColor | null = null;

    for (const [color, cards] of currentPlayer.properties) {
      const cardIndex = cards.findIndex(c => c.id === cardId);
      if (cardIndex !== -1) {
        foundCard = cards[cardIndex];
        oldColor = color;
        cards.splice(cardIndex, 1);
        break;
      }
    }

    if (!foundCard || !oldColor) {
      return {
        success: false,
        message: 'Wildcard not found in properties',
        error: 'CARD_NOT_FOUND'
      };
    }

    if (foundCard.category !== CardCategory.PROPERTY_WILDCARD) {
      return {
        success: false,
        message: 'Card is not a wildcard',
        error: 'NOT_A_WILDCARD'
      };
    }

    const wildcard = foundCard as PropertyWildcard;
    
    // Validate new color
    if (!wildcard.canAssignToColor(newColor)) {
      return {
        success: false,
        message: 'Wildcard cannot be assigned to this color',
        error: 'INVALID_COLOR'
      };
    }

    // Assign to new color
    wildcard.assignToColor(newColor);
    
    // Add to new property set
    if (!currentPlayer.properties.has(newColor)) {
      currentPlayer.properties.set(newColor, []);
    }
    currentPlayer.properties.get(newColor)!.push(wildcard);

    console.log(`${currentPlayer.name} moved wildcard from ${oldColor} to ${newColor}`);

    return {
      success: true,
      message: 'Wildcard moved successfully',
      newState: this.gameState
    };
  }
}

// Made with Bob