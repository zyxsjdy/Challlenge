import { GameState, Player, Card, PropertyCard, PropertyWildcard, ActionCard, RentCard } from 'shared';
import { GamePhase, CardCategory, PropertyColor, ActionType } from 'shared';
import { CardFactory } from './CardFactory';
import { TurnManager } from './TurnManager';
import { WinCondition } from './WinCondition';
import { RentHandler, RentData } from '../actions/RentHandler';
import { SlyDealHandler, ForceDealHandler, DealBreakerHandler } from '../actions/StealHandlers';
import { PaymentHandler, PaymentData } from '../actions/PaymentHandler';
import { ReactionHandler, ReactionData } from '../actions/ReactionHandler';
import {
  PassGoHandler,
  ItsMyBirthdayHandler,
  DebtCollectorHandler,
  HouseHandler,
  HotelHandler,
  DoubleTheRentHandler
} from '../actions/SpecialActionHandlers';
 
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
  private rentHandler: RentHandler;
  private slyDealHandler: SlyDealHandler;
  private forceDealHandler: ForceDealHandler;
  private dealBreakerHandler: DealBreakerHandler;
  private paymentHandler: PaymentHandler;
  private reactionHandler: ReactionHandler;
  private passGoHandler: PassGoHandler;
  private birthdayHandler: ItsMyBirthdayHandler;
  private debtCollectorHandler: DebtCollectorHandler;
  private houseHandler: HouseHandler;
  private hotelHandler: HotelHandler;
  private doubleRentHandler: DoubleTheRentHandler;
 
  constructor() {
    this.gameState = new GameState();
    this.deck = [];
    this.turnManager = new TurnManager();
    this.winCondition = new WinCondition();
    this.rentHandler = new RentHandler();
    this.slyDealHandler = new SlyDealHandler();
    this.forceDealHandler = new ForceDealHandler();
    this.dealBreakerHandler = new DealBreakerHandler();
    this.paymentHandler = new PaymentHandler();
    this.reactionHandler = new ReactionHandler();
    this.passGoHandler = new PassGoHandler();
    this.birthdayHandler = new ItsMyBirthdayHandler();
    this.debtCollectorHandler = new DebtCollectorHandler();
    this.houseHandler = new HouseHandler();
    this.hotelHandler = new HotelHandler();
    this.doubleRentHandler = new DoubleTheRentHandler();
  }
 
  /**
   * Initialize the game with player IDs and names
   * Loads deck, shuffles, and deals initial hands
   */
  initializeGame(playerIds: string[], playerNames: string[]): void {
    if (playerIds.length !== playerNames.length) {
      throw new Error('Player IDs and names arrays must have same length');
    }
    if (playerIds.length < 2) {
      throw new Error('Need at least 2 players to start');
    }
    if (playerIds.length > 5) {
      throw new Error('Maximum 5 players allowed');
    }
 
    // Create Player instances with actual socket IDs
    for (let i = 0; i < playerIds.length; i++) {
      const player = new Player(playerIds[i], playerNames[i]);
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
    
    // Draw 2 cards for the first player to start their turn
    const firstPlayer = this.gameState.getCurrentPlayer();
    this.gameState.drawCards(firstPlayer, 2);
 
    console.log(`Game initialized with ${playerNames.length} players`);
    console.log(`Deck size: ${this.gameState.drawPile.length} cards`);
    console.log(`First player ${firstPlayer.name} starts with ${firstPlayer.hand.length} cards`);
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
 
    try {
      const pendingAction = this.gameState.pendingAction;
 
      if (pendingAction.type === 'PAYMENT') {
        // Handle payment submission
        const paymentData = action.data as PaymentData;
        this.paymentHandler.processPayment(this.gameState, action.playerId, paymentData.cardIds);
      } else if (pendingAction.type === 'REACTION') {
        // Handle Just Say No response
        const reactionData = action.data as ReactionData;
        this.reactionHandler.handleReaction(this.gameState, action.playerId, reactionData);
      }
 
      return {
        success: true,
        message: 'Response processed',
        newState: this.gameState
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process response',
        error: 'RESPONSE_ERROR'
      };
    }
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
        // Execute action - handler is responsible for discarding
        this.executeAction(player, card, placement);
        // Note: Action handlers discard the card themselves
      }
    } else if (card.category === CardCategory.RENT) {
      // Execute rent - handler is responsible for discarding
      this.executeRent(player, card, placement);
      // Note: Rent handlers discard the card themselves
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
   * Execute action card
   */
  private executeAction(player: Player, card: Card, placement: any): void {
    const actionCard = card as ActionCard;
    console.log(`${player.name} played action: ${actionCard.name}`);

    // Get the appropriate handler
    let handler;
    switch (actionCard.actionType) {
      case ActionType.PASS_GO:
        handler = this.passGoHandler;
        break;
      case ActionType.ITS_MY_BIRTHDAY:
        handler = this.birthdayHandler;
        break;
      case ActionType.DEBT_COLLECTOR:
        handler = this.debtCollectorHandler;
        break;
      case ActionType.SLY_DEAL:
        handler = this.slyDealHandler;
        break;
      case ActionType.FORCE_DEAL:
        handler = this.forceDealHandler;
        break;
      case ActionType.DEAL_BREAKER:
        handler = this.dealBreakerHandler;
        break;
      case ActionType.HOUSE:
        handler = this.houseHandler;
        break;
      case ActionType.HOTEL:
        handler = this.hotelHandler;
        break;
      case ActionType.DOUBLE_THE_RENT:
        handler = this.doubleRentHandler;
        break;
      case ActionType.JUST_SAY_NO:
        throw new Error('Just Say No can only be used as a reaction');
      default:
        throw new Error(`Unknown action type: ${actionCard.actionType}`);
    }

    // Check if handler requires target selection
    if (handler.requiresTarget() && !placement?.targetPlayerId) {
      // Set game phase to awaiting target
      this.gameState.phase = GamePhase.AWAITING_TARGET;
      this.gameState.pendingAction = {
        type: 'TARGET_SELECTION',
        initiatorId: player.id,
        cardId: card.id,
        actionType: actionCard.actionType,
        actionData: { ...placement, pendingCard: card } // Store the card in actionData
      };
      
      // Remove card from hand (will be discarded by handler after target selection)
      const cardIndex = player.hand.findIndex(c => c.id === card.id);
      if (cardIndex !== -1) {
        player.hand.splice(cardIndex, 1);
      }
      
      console.log(`${actionCard.name} requires target selection - awaiting player input`);
      return;
    }

    // Execute the action with the handler
    handler.execute(this.gameState, player.id, card, placement);
  }
 
  /**
   * Execute rent card
   */
  private executeRent(player: Player, card: Card, placement: any): void {
    const rentCard = card as RentCard;
    console.log(`${player.name} played rent: ${rentCard.name}`);
 
    // Validate player can execute rent
    if (!this.rentHandler.canExecute(this.gameState, player.id, card)) {
      throw new Error('Cannot execute rent - no matching properties');
    }
 
    // Execute rent collection
    this.rentHandler.execute(this.gameState, player.id, card, placement as RentData);
  }
 
  /**
   * Complete a pending target selection
   */
  completeTargetSelection(targetPlayerId: string, additionalData?: any): ActionResult {
    if (this.gameState.phase !== GamePhase.AWAITING_TARGET) {
      return {
        success: false,
        message: 'No pending target selection',
        error: 'INVALID_PHASE'
      };
    }

    const pendingAction = this.gameState.pendingAction;
    if (!pendingAction || pendingAction.type !== 'TARGET_SELECTION') {
      return {
        success: false,
        message: 'No pending target selection action',
        error: 'NO_PENDING_ACTION'
      };
    }

    try {
      const player = this.gameState.players.find(p => p.id === pendingAction.initiatorId);
      if (!player) {
        throw new Error('Initiator player not found');
      }

      // Get the card from actionData (we stored it there when creating the pending action)
      const card = pendingAction.actionData?.pendingCard;
      if (!card) {
        throw new Error('Card not found in pending action data');
      }

      // Merge target data with original placement data
      const completeData = {
        ...pendingAction.actionData,
        targetPlayerId,
        ...additionalData
      };

      // Get the appropriate handler and execute
      const actionType = pendingAction.actionType as ActionType;
      let handler;
      switch (actionType) {
        case ActionType.DEBT_COLLECTOR:
          handler = this.debtCollectorHandler;
          break;
        case ActionType.SLY_DEAL:
          handler = this.slyDealHandler;
          break;
        case ActionType.FORCE_DEAL:
          handler = this.forceDealHandler;
          break;
        case ActionType.DEAL_BREAKER:
          handler = this.dealBreakerHandler;
          break;
        default:
          throw new Error(`Unknown action type for target selection: ${actionType}`);
      }

      // Execute the action with complete data
      handler.execute(this.gameState, player.id, card, completeData);

      // Clear pending action and return to playing phase
      this.gameState.pendingAction = null;
      this.gameState.phase = GamePhase.PLAYING;

      return {
        success: true,
        message: 'Target selection completed'
      };

    } catch (error) {
      console.error('Error completing target selection:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to complete target selection',
        error: 'EXECUTION_ERROR'
      };
    }
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
 
  /**
   * Discard cards from player's hand
   * Used when hand exceeds 7 cards at turn end
   */
  discardCards(playerId: string, cardIds: string[]): ActionResult {
    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) {
      return {
        success: false,
        message: 'Player not found',
        error: 'PLAYER_NOT_FOUND'
      };
    }
 
    // Validate it's the discard phase
    if (this.gameState.phase !== GamePhase.AWAITING_DISCARD) {
      return {
        success: false,
        message: 'Not in discard phase',
        error: 'INVALID_PHASE'
      };
    }
 
    // Validate player needs to discard
    const excessCards = player.hand.length - 7;
    if (excessCards <= 0) {
      return {
        success: false,
        message: 'No need to discard',
        error: 'NO_EXCESS_CARDS'
      };
    }
 
    // Validate correct number of cards to discard
    if (cardIds.length !== excessCards) {
      return {
        success: false,
        message: `Must discard exactly ${excessCards} cards`,
        error: 'INVALID_DISCARD_COUNT'
      };
    }
 
    // Discard the cards
    for (const cardId of cardIds) {
      const card = player.removeFromHand(cardId);
      if (!card) {
        return {
          success: false,
          message: `Card ${cardId} not found in hand`,
          error: 'CARD_NOT_FOUND'
        };
      }
      this.gameState.discardPile.push(card);
    }
 
    // Move to next player's turn
    this.gameState.phase = GamePhase.PLAYING;
    this.gameState.currentPlayerIndex =
      (this.gameState.currentPlayerIndex + 1) % this.gameState.players.length;
    // Start next player's turn
    this.turnManager.startTurn(this.gameState);
 
    console.log(`${player.name} discarded ${cardIds.length} cards`);
 
    return {
      success: true,
      message: 'Cards discarded successfully',
      newState: this.gameState
    };
  }
}
 
// Made with Bob