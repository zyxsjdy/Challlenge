import { GameState, Card, ActionCard, Player, PropertyCard, PropertyWildcard } from 'shared';
import { GamePhase, PropertyColor, ActionType } from 'shared';
import { ActionHandler } from './ActionHandler';

/**
 * Data for Sly Deal execution
 */
export interface SlyDealData {
  targetPlayerId: string;
  propertyCardId: string;
}

/**
 * Data for Force Deal execution
 */
export interface ForceDealData {
  targetPlayerId: string;
  myPropertyCardId: string;
  theirPropertyCardId: string;
}

/**
 * Data for Deal Breaker execution
 */
export interface DealBreakerData {
  targetPlayerId: string;
  propertyColor: PropertyColor;
}

/**
 * SlyDealHandler - Steal a single property from opponent
 * Property CANNOT be part of a completed set
 */
export class SlyDealHandler extends ActionHandler {
  canExecute(gameState: GameState, playerId: string, card: Card): boolean {
    if (!(card instanceof ActionCard) || (card as ActionCard).actionType !== ActionType.SLY_DEAL) {
      return false;
    }

    // Check if any opponent has a stealable property
    const opponents = this.getOpponents(gameState, playerId);
    for (const opponent of opponents) {
      if (this.hasStealableProperty(opponent)) {
        return true;
      }
    }

    return false;
  }

  requiresTarget(): boolean {
    return true;
  }

  execute(gameState: GameState, playerId: string, card: Card, data?: SlyDealData): void {
    if (!data || !data.targetPlayerId || !data.propertyCardId) {
      throw new Error('Sly Deal requires targetPlayerId and propertyCardId');
    }

    const player = this.getPlayer(gameState, playerId);
    const target = this.getPlayer(gameState, data.targetPlayerId);

    // Find the property card
    let propertyCard: Card | null = null;
    let propertyColor: PropertyColor | null = null;

    for (const [color, properties] of target.properties.entries()) {
      const card = properties.find((c: Card) => c.id === data.propertyCardId);
      if (card) {
        propertyCard = card;
        propertyColor = color;
        break;
      }
    }

    if (!propertyCard || !propertyColor) {
      throw new Error('Property card not found');
    }

    // Validate property is NOT part of completed set
    if (target.hasCompletedSet(propertyColor)) {
      throw new Error('Cannot steal property from completed set');
    }

    // Set up pending action for reaction
    gameState.phase = GamePhase.AWAITING_REACTION;
    gameState.pendingAction = {
      type: 'REACTION',
      initiatorId: playerId,
      targetId: data.targetPlayerId,
      canBeCountered: true,
      cardId: card.id
    };

    // Store steal details for execution after reaction
    (gameState.pendingAction as any).stealData = {
      propertyCardId: data.propertyCardId,
      propertyColor: propertyColor
    };
  }

  /**
   * Execute the actual property transfer (called after reaction resolution)
   */
  static executeTransfer(gameState: GameState, initiatorId: string, targetId: string, propertyCardId: string, propertyColor: PropertyColor): void {
    const initiator = gameState.players.find(p => p.id === initiatorId);
    const target = gameState.players.find(p => p.id === targetId);

    if (!initiator || !target) {
      throw new Error('Player not found');
    }

    // Remove from target
    const targetProperties = target.properties.get(propertyColor);
    if (!targetProperties) {
      throw new Error('Property color not found');
    }

    const cardIndex = targetProperties.findIndex((c: Card) => c.id === propertyCardId);
    if (cardIndex === -1) {
      throw new Error('Property card not found');
    }

    const card = targetProperties.splice(cardIndex, 1)[0];

    // Add to initiator's properties (maintain color grouping)
    if (!initiator.properties.has(propertyColor)) {
      initiator.properties.set(propertyColor, []);
    }
    initiator.properties.get(propertyColor)!.push(card);

    // Update completed sets for both players
    (target as any).updateCompletedSets?.();
    (initiator as any).updateCompletedSets?.();
  }

  private hasStealableProperty(player: Player): boolean {
    for (const [color, properties] of player.properties.entries()) {
      if (!player.hasCompletedSet(color) && properties.length > 0) {
        return true;
      }
    }
    return false;
  }
}

/**
 * ForceDealHandler - Swap properties with opponent
 * NEITHER property can be part of a completed set
 */
export class ForceDealHandler extends ActionHandler {
  canExecute(gameState: GameState, playerId: string, card: Card): boolean {
    if (!(card instanceof ActionCard) || (card as ActionCard).actionType !== ActionType.FORCE_DEAL) {
      return false;
    }

    const player = this.getPlayer(gameState, playerId);
    
    // Player must have at least one swappable property
    if (!this.hasSwappableProperty(player)) {
      return false;
    }

    // At least one opponent must have a swappable property
    const opponents = this.getOpponents(gameState, playerId);
    for (const opponent of opponents) {
      if (this.hasSwappableProperty(opponent)) {
        return true;
      }
    }

    return false;
  }

  requiresTarget(): boolean {
    return true;
  }

  execute(gameState: GameState, playerId: string, card: Card, data?: ForceDealData): void {
    if (!data || !data.targetPlayerId || !data.myPropertyCardId || !data.theirPropertyCardId) {
      throw new Error('Force Deal requires targetPlayerId, myPropertyCardId, and theirPropertyCardId');
    }

    const player = this.getPlayer(gameState, playerId);
    const target = this.getPlayer(gameState, data.targetPlayerId);

    // Validate both properties exist and are not in completed sets
    const myProperty = this.findProperty(player, data.myPropertyCardId);
    const theirProperty = this.findProperty(target, data.theirPropertyCardId);

    if (!myProperty || !theirProperty) {
      throw new Error('One or both properties not found');
    }

    if (player.hasCompletedSet(myProperty.color)) {
      throw new Error('Cannot swap property from your completed set');
    }

    if (target.hasCompletedSet(theirProperty.color)) {
      throw new Error('Cannot swap property from opponent completed set');
    }

    // Set up pending action for reaction
    gameState.phase = GamePhase.AWAITING_REACTION;
    gameState.pendingAction = {
      type: 'REACTION',
      initiatorId: playerId,
      targetId: data.targetPlayerId,
      canBeCountered: true,
      cardId: card.id
    };

    // Store swap details
    (gameState.pendingAction as any).swapData = {
      myPropertyCardId: data.myPropertyCardId,
      myPropertyColor: myProperty.color,
      theirPropertyCardId: data.theirPropertyCardId,
      theirPropertyColor: theirProperty.color
    };
  }

  /**
   * Execute the actual property swap (called after reaction resolution)
   */
  static executeSwap(
    gameState: GameState,
    initiatorId: string,
    targetId: string,
    myPropertyCardId: string,
    myPropertyColor: PropertyColor,
    theirPropertyCardId: string,
    theirPropertyColor: PropertyColor
  ): void {
    const initiator = gameState.players.find(p => p.id === initiatorId);
    const target = gameState.players.find(p => p.id === targetId);

    if (!initiator || !target) {
      throw new Error('Player not found');
    }

    // Remove my property
    const myProperties = initiator.properties.get(myPropertyColor)!;
    const myCardIndex = myProperties.findIndex((c: Card) => c.id === myPropertyCardId);
    const myCard = myProperties.splice(myCardIndex, 1)[0];

    // Remove their property
    const theirProperties = target.properties.get(theirPropertyColor)!;
    const theirCardIndex = theirProperties.findIndex((c: Card) => c.id === theirPropertyCardId);
    const theirCard = theirProperties.splice(theirCardIndex, 1)[0];

    // Add their card to my properties
    if (!initiator.properties.has(theirPropertyColor)) {
      initiator.properties.set(theirPropertyColor, []);
    }
    initiator.properties.get(theirPropertyColor)!.push(theirCard);

    // Add my card to their properties
    if (!target.properties.has(myPropertyColor)) {
      target.properties.set(myPropertyColor, []);
    }
    target.properties.get(myPropertyColor)!.push(myCard);

    // Update completed sets
    (initiator as any).updateCompletedSets?.();
    (target as any).updateCompletedSets?.();
  }

  private hasSwappableProperty(player: Player): boolean {
    for (const [color, properties] of player.properties.entries()) {
      if (!player.hasCompletedSet(color) && properties.length > 0) {
        return true;
      }
    }
    return false;
  }

  private findProperty(player: Player, cardId: string): { card: Card; color: PropertyColor } | null {
    for (const [color, properties] of player.properties.entries()) {
      const card = properties.find((c: Card) => c.id === cardId);
      if (card) {
        return { card, color };
      }
    }
    return null;
  }
}

/**
 * DealBreakerHandler - Steal an entire completed set
 * Includes House/Hotel if present
 */
export class DealBreakerHandler extends ActionHandler {
  canExecute(gameState: GameState, playerId: string, card: Card): boolean {
    if (!(card instanceof ActionCard) || (card as ActionCard).actionType !== ActionType.DEAL_BREAKER) {
      return false;
    }

    // Check if any opponent has a completed set
    const opponents = this.getOpponents(gameState, playerId);
    for (const opponent of opponents) {
      if (opponent.completedSets.length > 0) {
        return true;
      }
    }

    return false;
  }

  requiresTarget(): boolean {
    return true;
  }

  execute(gameState: GameState, playerId: string, card: Card, data?: DealBreakerData): void {
    if (!data || !data.targetPlayerId || !data.propertyColor) {
      throw new Error('Deal Breaker requires targetPlayerId and propertyColor');
    }

    const target = this.getPlayer(gameState, data.targetPlayerId);

    // Validate target has completed set of specified color
    if (!target.hasCompletedSet(data.propertyColor)) {
      throw new Error('Target does not have completed set of specified color');
    }

    // Set up pending action for reaction
    gameState.phase = GamePhase.AWAITING_REACTION;
    gameState.pendingAction = {
      type: 'REACTION',
      initiatorId: playerId,
      targetId: data.targetPlayerId,
      canBeCountered: true,
      cardId: card.id
    };

    // Store deal breaker details
    (gameState.pendingAction as any).dealBreakerData = {
      propertyColor: data.propertyColor
    };
  }

  /**
   * Execute the actual set transfer (called after reaction resolution)
   */
  static executeTransfer(gameState: GameState, initiatorId: string, targetId: string, propertyColor: PropertyColor): void {
    const initiator = gameState.players.find(p => p.id === initiatorId);
    const target = gameState.players.find(p => p.id === targetId);

    if (!initiator || !target) {
      throw new Error('Player not found');
    }

    // Get all properties of the specified color
    const properties = target.properties.get(propertyColor);
    if (!properties || properties.length === 0) {
      throw new Error('No properties found for specified color');
    }

    // Transfer entire set (including house/hotel)
    const cardsToTransfer = [...properties];
    target.properties.set(propertyColor, []);

    // Add to initiator's properties
    if (!initiator.properties.has(propertyColor)) {
      initiator.properties.set(propertyColor, []);
    }
    initiator.properties.get(propertyColor)!.push(...cardsToTransfer);

    // Update completed sets
    (target as any).updateCompletedSets?.();
    (initiator as any).updateCompletedSets?.();
  }
}

// Made with Bob