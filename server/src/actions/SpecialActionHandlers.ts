import { GameState, Card, ActionCard, Player, PropertyCard } from 'shared';
import { GamePhase, ActionType, PropertyColor } from 'shared';
import { GAME_CONSTANTS, canHaveBuildings } from 'shared';
import { ActionHandler } from './ActionHandler';
import { PaymentHandler } from './PaymentHandler';

/**
 * Data for House/Hotel placement
 */
export interface BuildingData {
  propertyColor: PropertyColor;
}

/**
 * PassGoHandler - Draw 2 additional cards
 * Does not count toward turn draw or play limit
 */
export class PassGoHandler extends ActionHandler {
  canExecute(gameState: GameState, playerId: string, card: Card): boolean {
    if (!(card instanceof ActionCard) || (card as ActionCard).actionType !== ActionType.PASS_GO) {
      return false;
    }
    // Can always play Pass Go (as long as it's your turn)
    return true;
  }

  requiresTarget(): boolean {
    return false;
  }

  execute(gameState: GameState, playerId: string, card: Card, data?: any): void {
    const player = this.getPlayer(gameState, playerId);

    // Draw 2 additional cards
    gameState.drawCards(player, GAME_CONSTANTS.PASS_GO_DRAW_COUNT);

    // Pass Go does not count toward play limit (already handled in GameEngine)
    // Card goes to discard pile
    gameState.discardPile.push(card);
  }
}

/**
 * ItsMyBirthdayHandler - Collect $2M from ALL opponents
 * Each opponent can use Just Say No
 */
export class ItsMyBirthdayHandler extends ActionHandler {
  private paymentHandler: PaymentHandler;

  constructor() {
    super();
    this.paymentHandler = new PaymentHandler();
  }

  canExecute(gameState: GameState, playerId: string, card: Card): boolean {
    if (!(card instanceof ActionCard) || (card as ActionCard).actionType !== ActionType.ITS_MY_BIRTHDAY) {
      return false;
    }

    // Can play if there are opponents
    return this.getOpponents(gameState, playerId).length > 0;
  }

  requiresTarget(): boolean {
    return false; // Targets all opponents automatically
  }

  execute(gameState: GameState, playerId: string, card: Card, data?: any): void {
    const opponents = this.getOpponents(gameState, playerId);
    const amount = GAME_CONSTANTS.ACTION_PAYMENTS.ITS_MY_BIRTHDAY;

    if (opponents.length === 0) {
      throw new Error('No opponents to collect from');
    }

    // Set up pending action for first opponent
    gameState.phase = GamePhase.AWAITING_REACTION;
    gameState.pendingAction = {
      type: 'PAYMENT',
      initiatorId: playerId,
      targetId: opponents[0].id,
      amount: amount,
      canBeCountered: true,
      cardId: card.id
    };

    // Store remaining targets for sequential processing
    (gameState.pendingAction as any).remainingTargets = opponents.slice(1).map(p => p.id);

    // Card goes to discard pile
    gameState.discardPile.push(card);
  }
}

/**
 * DebtCollectorHandler - Collect $5M from ONE opponent
 * Opponent can use Just Say No
 */
export class DebtCollectorHandler extends ActionHandler {
  private paymentHandler: PaymentHandler;

  constructor() {
    super();
    this.paymentHandler = new PaymentHandler();
  }

  canExecute(gameState: GameState, playerId: string, card: Card): boolean {
    if (!(card instanceof ActionCard) || (card as ActionCard).actionType !== ActionType.DEBT_COLLECTOR) {
      return false;
    }

    // Can play if there are opponents
    return this.getOpponents(gameState, playerId).length > 0;
  }

  requiresTarget(): boolean {
    return true; // Must select one opponent
  }

  execute(gameState: GameState, playerId: string, card: Card, data?: { targetPlayerId: string }): void {
    if (!data || !data.targetPlayerId) {
      throw new Error('Debt Collector requires targetPlayerId');
    }

    this.validatePlayer(gameState, data.targetPlayerId);
    const amount = GAME_CONSTANTS.ACTION_PAYMENTS.DEBT_COLLECTOR;

    // Set up pending action for reaction
    gameState.phase = GamePhase.AWAITING_REACTION;
    gameState.pendingAction = {
      type: 'PAYMENT',
      initiatorId: playerId,
      targetId: data.targetPlayerId,
      amount: amount,
      canBeCountered: true,
      cardId: card.id
    };

    // Card goes to discard pile
    gameState.discardPile.push(card);
  }
}

/**
 * HouseHandler - Place house on completed property set
 * Cannot place on Railroad/Utility
 * Must have completed set
 * Max 1 house per set
 */
export class HouseHandler extends ActionHandler {
  canExecute(gameState: GameState, playerId: string, card: Card): boolean {
    if (!(card instanceof ActionCard) || (card as ActionCard).actionType !== ActionType.HOUSE) {
      return false;
    }

    const player = this.getPlayer(gameState, playerId);

    // Check if player has any completed set that can have a house
    for (const color of player.completedSets) {
      if (canHaveBuildings(color)) {
        const properties = player.properties.get(color);
        if (properties) {
          // Check if set doesn't already have a house
          const hasHouse = properties.some((p: Card) => (p as any).hasHouse);
          if (!hasHouse) {
            return true;
          }
        }
      }
    }

    return false;
  }

  requiresTarget(): boolean {
    return false; // Requires property color selection, not player target
  }

  execute(gameState: GameState, playerId: string, card: Card, data?: BuildingData): void {
    if (!data || !data.propertyColor) {
      throw new Error('House requires propertyColor');
    }

    const player = this.getPlayer(gameState, playerId);

    // Validate set is complete
    if (!player.hasCompletedSet(data.propertyColor)) {
      throw new Error('Property set is not complete');
    }

    // Validate color can have buildings
    if (!canHaveBuildings(data.propertyColor)) {
      throw new Error(`Cannot place house on ${data.propertyColor} properties`);
    }

    const properties = player.properties.get(data.propertyColor);
    if (!properties || properties.length === 0) {
      throw new Error('No properties found for specified color');
    }

    // Check if set already has a house
    const hasHouse = properties.some((p: Card) => (p as any).hasHouse);
    if (hasHouse) {
      throw new Error('Set already has a house');
    }

    // Add house to the set (attach to first property card)
    const firstProperty = properties[0];
    (firstProperty as any).hasHouse = true;

    // Card goes to property area (attached to set)
    if (!player.properties.has(data.propertyColor)) {
      player.properties.set(data.propertyColor, []);
    }
    player.properties.get(data.propertyColor)!.push(card);
  }
}

/**
 * HotelHandler - Place hotel on completed property set
 * Cannot place on Railroad/Utility
 * Must have completed set
 * Must have house before hotel
 * Max 1 hotel per set
 */
export class HotelHandler extends ActionHandler {
  canExecute(gameState: GameState, playerId: string, card: Card): boolean {
    if (!(card instanceof ActionCard) || (card as ActionCard).actionType !== ActionType.HOTEL) {
      return false;
    }

    const player = this.getPlayer(gameState, playerId);

    // Check if player has any completed set with house but no hotel
    for (const color of player.completedSets) {
      if (canHaveBuildings(color)) {
        const properties = player.properties.get(color);
        if (properties) {
          const hasHouse = properties.some((p: Card) => (p as any).hasHouse);
          const hasHotel = properties.some((p: Card) => (p as any).hasHotel);
          
          if (hasHouse && !hasHotel) {
            return true;
          }
        }
      }
    }

    return false;
  }

  requiresTarget(): boolean {
    return false; // Requires property color selection, not player target
  }

  execute(gameState: GameState, playerId: string, card: Card, data?: BuildingData): void {
    if (!data || !data.propertyColor) {
      throw new Error('Hotel requires propertyColor');
    }

    const player = this.getPlayer(gameState, playerId);

    // Validate set is complete
    if (!player.hasCompletedSet(data.propertyColor)) {
      throw new Error('Property set is not complete');
    }

    // Validate color can have buildings
    if (!canHaveBuildings(data.propertyColor)) {
      throw new Error(`Cannot place hotel on ${data.propertyColor} properties`);
    }

    const properties = player.properties.get(data.propertyColor);
    if (!properties || properties.length === 0) {
      throw new Error('No properties found for specified color');
    }

    // Check if set has house
    const hasHouse = properties.some((p: Card) => (p as any).hasHouse);
    if (!hasHouse) {
      throw new Error('Must have house before placing hotel');
    }

    // Check if set already has hotel
    const hasHotel = properties.some((p: Card) => (p as any).hasHotel);
    if (hasHotel) {
      throw new Error('Set already has a hotel');
    }

    // Add hotel to the set (attach to first property card)
    const firstProperty = properties[0];
    (firstProperty as any).hasHotel = true;

    // Card goes to property area (attached to set)
    player.properties.get(data.propertyColor)!.push(card);
  }
}

/**
 * DoubleTheRentHandler - Doubles the rent from a rent card
 * Must be played immediately after a rent card
 * Counts as a separate play toward the 3-card limit
 */
export class DoubleTheRentHandler extends ActionHandler {
  canExecute(gameState: GameState, playerId: string, card: Card): boolean {
    if (!(card instanceof ActionCard) || (card as ActionCard).actionType !== ActionType.DOUBLE_THE_RENT) {
      return false;
    }

    // Can only be played if there's a pending rent action
    // This would be validated in the GameEngine when routing the card
    return true;
  }

  requiresTarget(): boolean {
    return false;
  }

  execute(gameState: GameState, playerId: string, card: Card, data?: any): void {
    // Double the Rent is handled in RentHandler
    // This handler is mainly for validation
    // The actual doubling logic is in RentHandler.execute()
    
    // Card goes to discard pile
    gameState.discardPile.push(card);
  }
}

// Made with Bob