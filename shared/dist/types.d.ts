import { CardCategory, PropertyColor, ActionType, GamePhase } from './enums';
/**
 * Base abstract Card class - foundation for all card types
 */
export declare abstract class Card {
    id: string;
    category: CardCategory;
    name: string;
    monetaryValue: number;
    constructor(id: string, category: CardCategory, name: string, value: number);
    /**
     * Determines if card can be used for debt payment
     * 10-Color Wildcard returns false (has no monetary value)
     */
    abstract canBeUsedForPayment(): boolean;
}
/**
 * MoneyCard - Pure currency cards that always go to bank
 */
export declare class MoneyCard extends Card {
    constructor(id: string, name: string, value: number);
    canBeUsedForPayment(): boolean;
}
/**
 * PropertyCard - Standard property cards with color and rent values
 */
export declare class PropertyCard extends Card {
    color: PropertyColor;
    fullSetSize: number;
    rentValues: number[];
    constructor(id: string, name: string, value: number, color: PropertyColor, fullSetSize: number, rentValues: number[]);
    canBeUsedForPayment(): boolean;
    /**
     * Get rent value based on number of properties in set
     */
    getRentValue(propertiesInSet: number): number;
}
/**
 * PropertyWildcard - Dual-color or 10-color wildcard properties
 */
export declare class PropertyWildcard extends Card {
    validColors: PropertyColor[];
    currentColor: PropertyColor | null;
    constructor(id: string, name: string, value: number, validColors: PropertyColor[]);
    canBeUsedForPayment(): boolean;
    /**
     * Check if wildcard can be assigned to a specific color
     */
    canAssignToColor(color: PropertyColor): boolean;
    /**
     * Assign wildcard to a specific color
     */
    assignToColor(color: PropertyColor): void;
}
/**
 * ActionCard - Cards with special game effects
 */
export declare class ActionCard extends Card {
    actionType: ActionType;
    description: string;
    requiresTarget: boolean;
    constructor(id: string, name: string, value: number, actionType: ActionType, description: string, requiresTarget: boolean);
    canBeUsedForPayment(): boolean;
}
/**
 * RentCard - Cards that collect rent from opponents
 */
export declare class RentCard extends Card {
    validColors: PropertyColor[];
    isWild: boolean;
    constructor(id: string, name: string, value: number, validColors: PropertyColor[], isWild: boolean);
    canBeUsedForPayment(): boolean;
    /**
     * Check if rent card can be used for a specific property color
     */
    canChargeForColor(color: PropertyColor): boolean;
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
    actionType?: string;
    actionData?: any;
}
/**
 * Player - Represents a game player with their cards and properties
 */
export declare class Player {
    id: string;
    name: string;
    hand: Card[];
    bank: Card[];
    properties: Map<PropertyColor, Card[]>;
    completedSets: PropertyColor[];
    constructor(id: string, name: string);
    /**
     * Add card to player's hand
     */
    addToHand(card: Card): void;
    /**
     * Play card to bank (money storage)
     */
    playToBank(card: Card): void;
    /**
     * Play property card to property area
     */
    playToProperties(card: Card, color: PropertyColor): void;
    /**
     * Calculate total monetary value in bank
     */
    calculateTotalMoney(): number;
    /**
     * Check if player has completed a specific property set
     */
    hasCompletedSet(color: PropertyColor): boolean;
    /**
     * Count total number of completed sets
     */
    countCompletedSets(): number;
    /**
     * Update completed sets based on current properties
     */
    private updateCompletedSets;
    /**
     * Remove card from hand by ID
     */
    removeFromHand(cardId: string): Card | null;
    /**
     * Get all cards that can be used for payment
     */
    getPayableCards(): Card[];
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
        properties: Record<PropertyColor, Card[]>;
        completedSets: PropertyColor[];
    }[];
    currentPlayerId: string | null;
    phase: GamePhase;
    turnPlayCount: number;
    drawPileCount: number;
    discardPileTop: Card | null;
    pendingAction: PendingAction | null;
    winner: Player | null;
    myHand?: Card[];
}
/**
 * GameState - Central game state managed by server
 */
export declare class GameState {
    players: Player[];
    drawPile: Card[];
    discardPile: Card[];
    currentPlayerIndex: number;
    phase: GamePhase;
    turnPlayCount: number;
    pendingAction: PendingAction | null;
    winner: Player | null;
    constructor();
    /**
     * Initialize deck with cards from CSV
     */
    initializeDeck(cards: Card[]): void;
    /**
     * Shuffle the draw pile using Fisher-Yates algorithm
     */
    shuffleDeck(): void;
    /**
     * Deal initial hands to all players (5 cards each)
     */
    dealInitialHands(): void;
    /**
     * Draw cards from draw pile to player's hand
     * Reshuffles discard pile if draw pile is empty
     */
    drawCards(player: Player, count: number): void;
    /**
     * Advance to next player's turn
     */
    nextTurn(): void;
    /**
     * Check if any player has won (3 complete sets)
     */
    checkWinCondition(): Player | null;
    /**
     * Get current player
     */
    getCurrentPlayer(): Player;
    /**
     * Add player to game
     */
    addPlayer(player: Player): void;
    /**
     * Start the game
     */
    startGame(): void;
    /**
     * Sanitize game state for a specific player (hide opponent hands and draw pile)
     */
    sanitizeForPlayer(playerId: string): SanitizedGameState;
}
