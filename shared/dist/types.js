"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameState = exports.Player = exports.RentCard = exports.ActionCard = exports.PropertyWildcard = exports.PropertyCard = exports.MoneyCard = exports.Card = void 0;
const enums_1 = require("./enums");
/**
 * Base abstract Card class - foundation for all card types
 */
class Card {
    constructor(id, category, name, value) {
        this.id = id;
        this.category = category;
        this.name = name;
        this.monetaryValue = value;
    }
}
exports.Card = Card;
/**
 * MoneyCard - Pure currency cards that always go to bank
 */
class MoneyCard extends Card {
    constructor(id, name, value) {
        super(id, enums_1.CardCategory.MONEY, name, value);
    }
    canBeUsedForPayment() {
        return true;
    }
}
exports.MoneyCard = MoneyCard;
/**
 * PropertyCard - Standard property cards with color and rent values
 */
class PropertyCard extends Card {
    constructor(id, name, value, color, fullSetSize, rentValues) {
        super(id, enums_1.CardCategory.PROPERTY, name, value);
        this.color = color;
        this.fullSetSize = fullSetSize;
        this.rentValues = rentValues;
    }
    canBeUsedForPayment() {
        return true;
    }
    /**
     * Get rent value based on number of properties in set
     */
    getRentValue(propertiesInSet) {
        const index = Math.min(propertiesInSet - 1, this.rentValues.length - 1);
        return this.rentValues[Math.max(0, index)];
    }
}
exports.PropertyCard = PropertyCard;
/**
 * PropertyWildcard - Dual-color or 10-color wildcard properties
 */
class PropertyWildcard extends Card {
    constructor(id, name, value, validColors) {
        super(id, enums_1.CardCategory.PROPERTY_WILDCARD, name, value);
        this.validColors = validColors;
        this.currentColor = null;
    }
    canBeUsedForPayment() {
        // 10-Color Wildcard has value 0 and cannot be used for payment
        return this.monetaryValue > 0;
    }
    /**
     * Check if wildcard can be assigned to a specific color
     */
    canAssignToColor(color) {
        return this.validColors.includes(color);
    }
    /**
     * Assign wildcard to a specific color
     */
    assignToColor(color) {
        if (!this.canAssignToColor(color)) {
            throw new Error(`Cannot assign wildcard to color ${color}`);
        }
        this.currentColor = color;
    }
}
exports.PropertyWildcard = PropertyWildcard;
/**
 * ActionCard - Cards with special game effects
 */
class ActionCard extends Card {
    constructor(id, name, value, actionType, description, requiresTarget) {
        super(id, enums_1.CardCategory.ACTION, name, value);
        this.actionType = actionType;
        this.description = description;
        this.requiresTarget = requiresTarget;
    }
    canBeUsedForPayment() {
        return true; // Action cards can be banked for their monetary value
    }
}
exports.ActionCard = ActionCard;
/**
 * RentCard - Cards that collect rent from opponents
 */
class RentCard extends Card {
    constructor(id, name, value, validColors, isWild) {
        super(id, enums_1.CardCategory.RENT, name, value);
        this.validColors = validColors;
        this.isWild = isWild;
    }
    canBeUsedForPayment() {
        return true;
    }
    /**
     * Check if rent card can be used for a specific property color
     */
    canChargeForColor(color) {
        return this.validColors.includes(color);
    }
}
exports.RentCard = RentCard;
/**
 * Player - Represents a game player with their cards and properties
 */
class Player {
    constructor(id, name) {
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
    addToHand(card) {
        this.hand.push(card);
    }
    /**
     * Play card to bank (money storage)
     */
    playToBank(card) {
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
    playToProperties(card, color) {
        const index = this.hand.findIndex(c => c.id === card.id);
        if (index === -1) {
            throw new Error('Card not in hand');
        }
        // Validate card can be played as property
        if (card.category === enums_1.CardCategory.PROPERTY) {
            const propCard = card;
            if (propCard.color !== color) {
                throw new Error('Property color mismatch');
            }
        }
        else if (card.category === enums_1.CardCategory.PROPERTY_WILDCARD) {
            const wildcard = card;
            if (!wildcard.canAssignToColor(color)) {
                throw new Error('Wildcard cannot be assigned to this color');
            }
            wildcard.assignToColor(color);
        }
        else {
            throw new Error('Card is not a property');
        }
        this.hand.splice(index, 1);
        if (!this.properties.has(color)) {
            this.properties.set(color, []);
        }
        this.properties.get(color).push(card);
        // Check if set is now complete
        this.updateCompletedSets();
    }
    /**
     * Calculate total monetary value in bank
     */
    calculateTotalMoney() {
        return this.bank.reduce((sum, card) => sum + card.monetaryValue, 0);
    }
    /**
     * Check if player has completed a specific property set
     */
    hasCompletedSet(color) {
        return this.completedSets.includes(color);
    }
    /**
     * Count total number of completed sets
     */
    countCompletedSets() {
        return this.completedSets.length;
    }
    /**
     * Update completed sets based on current properties
     */
    updateCompletedSets() {
        this.completedSets = [];
        // Import constants to check set sizes
        // This will be properly imported once constants.ts is created
        const SET_SIZES = {
            [enums_1.PropertyColor.BROWN]: 2,
            [enums_1.PropertyColor.LIGHT_BLUE]: 3,
            [enums_1.PropertyColor.PURPLE]: 3,
            [enums_1.PropertyColor.ORANGE]: 3,
            [enums_1.PropertyColor.RED]: 3,
            [enums_1.PropertyColor.YELLOW]: 3,
            [enums_1.PropertyColor.GREEN]: 3,
            [enums_1.PropertyColor.DARK_BLUE]: 2,
            [enums_1.PropertyColor.RAILROAD]: 4,
            [enums_1.PropertyColor.UTILITY]: 2,
            [enums_1.PropertyColor.WILD_10_COLOR]: 0 // Not a completable set
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
    removeFromHand(cardId) {
        const index = this.hand.findIndex(c => c.id === cardId);
        if (index === -1)
            return null;
        return this.hand.splice(index, 1)[0];
    }
    /**
     * Get all cards that can be used for payment
     */
    getPayableCards() {
        const payable = [];
        // Add bank cards
        payable.push(...this.bank);
        // Add properties (excluding 10-color wildcards)
        for (const cards of this.properties.values()) {
            payable.push(...cards.filter(c => c.canBeUsedForPayment()));
        }
        return payable;
    }
}
exports.Player = Player;
/**
 * GameState - Central game state managed by server
 */
class GameState {
    constructor() {
        this.players = [];
        this.drawPile = [];
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.phase = enums_1.GamePhase.WAITING_FOR_PLAYERS;
        this.turnPlayCount = 0;
        this.pendingAction = null;
        this.winner = null;
    }
    /**
     * Initialize deck with cards from CSV
     */
    initializeDeck(cards) {
        this.drawPile = [...cards];
    }
    /**
     * Shuffle the draw pile using Fisher-Yates algorithm
     */
    shuffleDeck() {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
        }
    }
    /**
     * Deal initial hands to all players (5 cards each)
     */
    dealInitialHands() {
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
    drawCards(player, count) {
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
    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.turnPlayCount = 0;
        this.phase = enums_1.GamePhase.PLAYING;
        // Draw cards for new turn
        const currentPlayer = this.players[this.currentPlayerIndex];
        const drawCount = currentPlayer.hand.length === 0 ? 5 : 2;
        this.drawCards(currentPlayer, drawCount);
    }
    /**
     * Check if any player has won (3 complete sets)
     */
    checkWinCondition() {
        const WINNING_SET_COUNT = 3;
        for (const player of this.players) {
            if (player.countCompletedSets() >= WINNING_SET_COUNT) {
                this.winner = player;
                this.phase = enums_1.GamePhase.GAME_OVER;
                return player;
            }
        }
        return null;
    }
    /**
     * Get current player
     */
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    /**
     * Add player to game
     */
    addPlayer(player) {
        if (this.phase !== enums_1.GamePhase.WAITING_FOR_PLAYERS) {
            throw new Error('Cannot add players after game has started');
        }
        this.players.push(player);
    }
    /**
     * Start the game
     */
    startGame() {
        if (this.players.length < 2) {
            throw new Error('Need at least 2 players to start');
        }
        if (this.players.length > 5) {
            throw new Error('Maximum 5 players allowed');
        }
        this.shuffleDeck();
        this.dealInitialHands();
        this.phase = enums_1.GamePhase.PLAYING;
    }
    /**
     * Sanitize game state for a specific player (hide opponent hands and draw pile)
     */
    sanitizeForPlayer(playerId) {
        return {
            players: this.players.map(p => {
                // Convert Map to plain object for JSON serialization
                const propertiesObj = {};
                p.properties.forEach((cards, color) => {
                    propertiesObj[color] = cards;
                });
                return {
                    id: p.id,
                    name: p.name,
                    handCount: p.hand.length,
                    bank: p.bank,
                    properties: propertiesObj,
                    completedSets: p.completedSets
                };
            }),
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
exports.GameState = GameState;
// Made with Bob
