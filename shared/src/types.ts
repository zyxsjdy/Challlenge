import { CardCategory, PropertyColor, ActionType, GamePhase } from './enums';

/**
 * Base abstract Card class - foundation for all card types
 */
export abstract class Card {
  id: string;
  category: CardCategory;
  name: string;
  monetaryValue: number;

  constructor(id: string, category: CardCategory, name: string, value: number) {
    this.id = id;
    this.category = category;
    this.name = name;
    this.monetaryValue = value;
  }

  /**
   * Determines if card can be used for debt payment
   * 10-Color Wildcard returns false (has no monetary value)
   */
  abstract canBeUsedForPayment(): boolean;
}

/**
 * MoneyCard - Pure currency cards that always go to bank
 */
export class MoneyCard extends Card {
  constructor(id: string, name: string, value: number) {
    super(id, CardCategory.MONEY, name, value);
  }

  canBeUsedForPayment(): boolean {
    return true;
  }
}

/**
 * PropertyCard - Standard property cards with color and rent values
 */
export class PropertyCard extends Card {
  color: PropertyColor;
  fullSetSize: number;
  rentValues: number[]; // Progressive rent based on set completion

  constructor(
    id: string,
    name: string,
    value: number,
    color: PropertyColor,
    fullSetSize: number,
    rentValues: number[]
  ) {
    super(id, CardCategory.PROPERTY, name, value);
    this.color = color;
    this.fullSetSize = fullSetSize;
    this.rentValues = rentValues;
  }

  canBeUsedForPayment(): boolean {
    return true;
  }

  /**
   * Get rent value based on number of properties in set
   */
  getRentValue(propertiesInSet: number): number {
    const index = Math.min(propertiesInSet - 1, this.rentValues.length - 1);
    return this.rentValues[Math.max(0, index)];
  }
}

/**
 * PropertyWildcard - Dual-color or 10-color wildcard properties
 */
export class PropertyWildcard extends Card {
  validColors: PropertyColor[]; // Dual-color has 2, 10-color has all
  currentColor: PropertyColor | null; // Current assigned color

  constructor(
    id: string,
    name: string,
    value: number,
    validColors: PropertyColor[]
  ) {
    super(id, CardCategory.PROPERTY_WILDCARD, name, value);
    this.validColors = validColors;
    this.currentColor = null;
  }

  canBeUsedForPayment(): boolean {
    // 10-Color Wildcard has value 0 and cannot be used for payment
    return this.monetaryValue > 0;
  }

  /**
   * Check if wildcard can be assigned to a specific color
   */
  canAssignToColor(color: PropertyColor): boolean {
    return this.validColors.includes(color);
  }

  /**
   * Assign wildcard to a specific color
   */
  assignToColor(color: PropertyColor): void {
    if (!this.canAssignToColor(color)) {
      throw new Error(`Cannot assign wildcard to color ${color}`);
    }
    this.currentColor = color;
  }
}

/**
 * ActionCard - Cards with special game effects
 */
export class ActionCard extends Card {
  actionType: ActionType;
  description: string;
  requiresTarget: boolean; // Whether card needs target player selection

  constructor(
    id: string,
    name: string,
    value: number,
    actionType: ActionType,
    description: string,
    requiresTarget: boolean
  ) {
    super(id, CardCategory.ACTION, name, value);
    this.actionType = actionType;
    this.description = description;
    this.requiresTarget = requiresTarget;
  }

  canBeUsedForPayment(): boolean {
    return true; // Action cards can be banked for their monetary value
  }
}

/**
 * RentCard - Cards that collect rent from opponents
 */
export class RentCard extends Card {
  validColors: PropertyColor[]; // Colors this rent card applies to
  isWild: boolean; // True for 10-color wild rent

  constructor(
    id: string,
    name: string,
    value: number,
    validColors: PropertyColor[],
    isWild: boolean
  ) {
    super(id, CardCategory.RENT, name, value);
    this.validColors = validColors;
    this.isWild = isWild;
  }

  canBeUsedForPayment(): boolean {
    return true;
  }

  /**
   * Check if rent card can be used for a specific property color
   */
  canChargeForColor(color: PropertyColor): boolean {
    return this.validColors.includes(color);
  }
}

/**
 * PendingAction - Tracks actions awaiting resolution (payments, reactions)
 */
export interface PendingAction {
  type: 'PAYMENT' | 'REACTION' | 'TARGET_SELECTION';
  initiatorId: string;
  targetId?: string;
  amount?: number;
  cardId?: string;
  canBeCountered?: boolean;
}

/**
 * Player - Represents a game player with their cards and properties
 */
export class Player {
  id: string;
  name: string;
  hand: Card[];
  bank: Card[];
  properties: Map<PropertyColor, Card[]>; // Grouped by color
  completedSets: PropertyColor[];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.hand = [];
    this.bank = [];
    this.properties = new Map();
    this.completedSets = [];
  }

  /**
   * Add card to player's hand
   */
  addToHand(card: Card): void {
    this.hand.push(card);
  }

  /**
   * Play card to bank (money storage)
   */
  playToBank(card: Card): void {
    const index = this.hand.findIndex(c => c.id === card.id);
    if (index === -1) {
      throw new Error('Card not in hand');
    }
    this.hand.splice(index, 1);
    this.bank.push(card);
  }

  /**
   * Play property card to property area
   */
  playToProperties(card: Card, color: PropertyColor): void {
    const index = this.hand.findIndex(c => c.id === card.id);
    if (index === -1) {
      throw new Error('Card not in hand');
    }

    // Validate card can be played as property
    if (card.category === CardCategory.PROPERTY) {
      const propCard = card as PropertyCard;
      if (propCard.color !== color) {
        throw new Error('Property color mismatch');
      }
    } else if (card.category === CardCategory.PROPERTY_WILDCARD) {
      const wildcard = card as PropertyWildcard;
      if (!wildcard.canAssignToColor(color)) {
        throw new Error('Wildcard cannot be assigned to this color');
      }
      wildcard.assignToColor(color);
    } else {
      throw new Error('Card is not a property');
    }

    this.hand.splice(index, 1);
    
    if (!this.properties.has(color)) {
      this.properties.set(color, []);
    }
    this.properties.get(color)!.push(card);

    // Check if set is now complete
    this.updateCompletedSets();
  }

  /**
   * Calculate total monetary value in bank
   */
  calculateTotalMoney(): number {
    return this.bank.reduce((sum, card) => sum + card.monetaryValue, 0);
  }

  /**
   * Check if player has completed a specific property set
   */
  hasCompletedSet(color: PropertyColor): boolean {
    return this.completedSets.includes(color);
  }

  /**
   * Count total number of completed sets
   */
  countCompletedSets(): number {
    return this.completedSets.length;
  }

  /**
   * Update completed sets based on current properties
   */
  private updateCompletedSets(): void {
    this.completedSets = [];
    
    // Import constants to check set sizes
    // This will be properly imported once constants.ts is created
    const SET_SIZES: Record<PropertyColor, number> = {
      [PropertyColor.BROWN]: 2,
      [PropertyColor.LIGHT_BLUE]: 3,
      [PropertyColor.PURPLE]: 3,
      [PropertyColor.ORANGE]: 3,
      [PropertyColor.RED]: 3,
      [PropertyColor.YELLOW]: 3,
      [PropertyColor.GREEN]: 3,
      [PropertyColor.DARK_BLUE]: 2,
      [PropertyColor.RAILROAD]: 4,
      [PropertyColor.UTILITY]: 2,
      [PropertyColor.WILD_10_COLOR]: 0 // Not a completable set
    };

    for (const [color, cards] of this.properties.entries()) {
      const requiredSize = SET_SIZES[color];
      if (requiredSize > 0 && cards.length >= requiredSize) {
        this.completedSets.push(color);
      }
    }
  }

  /**
   * Remove card from hand by ID
   */
  removeFromHand(cardId: string): Card | null {
    const index = this.hand.findIndex(c => c.id === cardId);
    if (index === -1) return null;
    return this.hand.splice(index, 1)[0];
  }

  /**
   * Get all cards that can be used for payment
   */
  getPayableCards(): Card[] {
    const payable: Card[] = [];
    
    // Add bank cards
    payable.push(...this.bank);
    
    // Add properties (excluding 10-color wildcards)
    for (const cards of this.properties.values()) {
      payable.push(...cards.filter(c => c.canBeUsedForPayment()));
    }
    
    return payable;
  }
}

/**
 * SanitizedGameState - Client-safe version hiding opponent hands and draw pile
 */
export interface SanitizedGameState {
  players: {
    id: string;
    name: string;
    handCount: number;
    bank: Card[];
    properties: Map<PropertyColor, Card[]>;
    completedSets: PropertyColor[];
  }[];
  currentPlayerId: string;
  phase: GamePhase;
  turnPlayCount: number;
  drawPileCount: number;
  discardPileTop: Card | null;
  pendingAction: PendingAction | null;
  winner: Player | null;
  myHand?: Card[]; // Only included for the requesting player
}

/**
 * GameState - Central game state managed by server
 */
export class GameState {
  players: Player[];
  drawPile: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  phase: GamePhase;
  turnPlayCount: number; // Track 3-card play limit
  pendingAction: PendingAction | null; // For interrupts and async actions
  winner: Player | null;

  constructor() {
    this.players = [];
    this.drawPile = [];
    this.discardPile = [];
    this.currentPlayerIndex = 0;
    this.phase = GamePhase.WAITING_FOR_PLAYERS;
    this.turnPlayCount = 0;
    this.pendingAction = null;
    this.winner = null;
  }

  /**
   * Initialize deck with cards from CSV
   */
  initializeDeck(cards: Card[]): void {
    this.drawPile = [...cards];
  }

  /**
   * Shuffle the draw pile using Fisher-Yates algorithm
   */
  shuffleDeck(): void {
    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
    }
  }

  /**
   * Deal initial hands to all players (5 cards each)
   */
  dealInitialHands(): void {
    const INITIAL_HAND_SIZE = 5;
    for (const player of this.players) {
      for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
        this.drawCards(player, 1);
      }
    }
  }

  /**
   * Draw cards from draw pile to player's hand
   * Reshuffles discard pile if draw pile is empty
   */
  drawCards(player: Player, count: number): void {
    for (let i = 0; i < count; i++) {
      // Reshuffle discard pile if draw pile is empty
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) {
          break; // No cards left to draw
        }
        this.drawPile = [...this.discardPile];
        this.discardPile = [];
        this.shuffleDeck();
      }

      const card = this.drawPile.pop();
      if (card) {
        player.addToHand(card);
      }
    }
  }

  /**
   * Advance to next player's turn
   */
  nextTurn(): void {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.turnPlayCount = 0;
    this.phase = GamePhase.PLAYING;

    // Draw cards for new turn
    const currentPlayer = this.players[this.currentPlayerIndex];
    const drawCount = currentPlayer.hand.length === 0 ? 5 : 2;
    this.drawCards(currentPlayer, drawCount);
  }

  /**
   * Check if any player has won (3 complete sets)
   */
  checkWinCondition(): Player | null {
    const WINNING_SET_COUNT = 3;
    for (const player of this.players) {
      if (player.countCompletedSets() >= WINNING_SET_COUNT) {
        this.winner = player;
        this.phase = GamePhase.GAME_OVER;
        return player;
      }
    }
    return null;
  }

  /**
   * Get current player
   */
  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Add player to game
   */
  addPlayer(player: Player): void {
    if (this.phase !== GamePhase.WAITING_FOR_PLAYERS) {
      throw new Error('Cannot add players after game has started');
    }
    this.players.push(player);
  }

  /**
   * Start the game
   */
  startGame(): void {
    if (this.players.length < 2) {
      throw new Error('Need at least 2 players to start');
    }
    if (this.players.length > 5) {
      throw new Error('Maximum 5 players allowed');
    }
    
    this.shuffleDeck();
    this.dealInitialHands();
    this.phase = GamePhase.PLAYING;
  }

  /**
   * Sanitize game state for a specific player (hide opponent hands and draw pile)
   */
  sanitizeForPlayer(playerId: string): SanitizedGameState {
    return {
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        handCount: p.hand.length,
        bank: p.bank,
        properties: p.properties,
        completedSets: p.completedSets
      })),
      currentPlayerId: this.players[this.currentPlayerIndex].id,
      phase: this.phase,
      turnPlayCount: this.turnPlayCount,
      drawPileCount: this.drawPile.length,
      discardPileTop: this.discardPile.length > 0 ? this.discardPile[this.discardPile.length - 1] : null,
      pendingAction: this.pendingAction,
      winner: this.winner,
      myHand: this.players.find(p => p.id === playerId)?.hand
    };
  }
}

// Made with Bob
