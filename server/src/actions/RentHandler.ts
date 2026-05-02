import { GameState, Card, RentCard, Player, PropertyCard, PropertyWildcard } from 'shared';
import { GamePhase, PropertyColor, ActionType } from 'shared';
import { calculateRent, GAME_CONSTANTS } from 'shared';
import { ActionHandler } from './ActionHandler';

/**
 * Data structure for rent card execution
 */
export interface RentData {
  selectedColor: PropertyColor;
  targetPlayerId?: string; // Only for wild rent cards
  doubleTheRent?: boolean; // If Double the Rent was played
}

/**
 * RentHandler - Handles rent card execution and rent collection
 * Validates property ownership and calculates rent with bonuses
 */
export class RentHandler extends ActionHandler {
  /**
   * Check if player can execute rent card
   * Player must own at least one property of a valid color
   */
  canExecute(gameState: GameState, playerId: string, card: Card): boolean {
    if (!(card instanceof RentCard)) {
      return false;
    }

    const player = this.getPlayer(gameState, playerId);
    const rentCard = card as RentCard;

    // Check if player has any property matching the rent card's valid colors
    for (const color of rentCard.validColors) {
      const properties = player.properties.get(color);
      if (properties && properties.length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Wild rent cards require target selection
   */
  requiresTarget(): boolean {
    return false; // Target is determined by card type (wild vs standard)
  }

  /**
   * Execute rent card - collect rent from opponents
   */
  execute(gameState: GameState, playerId: string, card: Card, data?: RentData): void {
    if (!data || !data.selectedColor) {
      throw new Error('Rent card requires selectedColor in data');
    }

    const rentCard = card as RentCard;
    const player = this.getPlayer(gameState, playerId);

    // Validate player owns property of selected color
    const properties = player.properties.get(data.selectedColor);
    if (!properties || properties.length === 0) {
      throw new Error(`Player does not own any ${data.selectedColor} properties`);
    }

    // Validate selected color is valid for this rent card
    if (!rentCard.canChargeForColor(data.selectedColor)) {
      throw new Error(`Rent card cannot charge for ${data.selectedColor}`);
    }

    // Calculate base rent
    const propertyCount = properties.length;
    const isComplete = player.hasCompletedSet(data.selectedColor);
    
    // Check for house/hotel bonuses
    const hasHouse = properties.some((p: Card) =>
      p instanceof PropertyCard && (p as any).hasHouse
    );
    const hasHotel = properties.some((p: Card) =>
      p instanceof PropertyCard && (p as any).hasHotel
    );

    let totalRent = calculateRent(data.selectedColor, propertyCount, hasHouse, hasHotel);

    // Apply Double the Rent if specified
    if (data.doubleTheRent) {
      totalRent *= 2;
      gameState.turnPlayCount++; // Double the Rent counts as a separate play
    }

    // Determine targets
    let targets: string[];
    if (rentCard.isWild) {
      // Wild rent targets ONE specific opponent
      if (!data.targetPlayerId) {
        throw new Error('Wild rent card requires targetPlayerId');
      }
      this.validatePlayer(gameState, data.targetPlayerId);
      targets = [data.targetPlayerId];
    } else {
      // Standard rent targets ALL opponents
      targets = this.getOpponents(gameState, playerId).map(p => p.id);
    }

    // Create pending action for each target
    // In a real implementation, this would trigger reaction prompts
    // For now, we'll set up the first pending action
    if (targets.length > 0) {
      gameState.phase = GamePhase.AWAITING_REACTION;
      gameState.pendingAction = {
        type: 'PAYMENT',
        initiatorId: playerId,
        targetId: targets[0],
        amount: totalRent,
        canBeCountered: true,
        cardId: card.id
      };

      // Store remaining targets for sequential processing
      (gameState.pendingAction as any).remainingTargets = targets.slice(1);
    }
  }

  /**
   * Calculate rent for a specific property set
   * Helper method for external use
   */
  static calculateRentForSet(
    player: Player,
    color: PropertyColor,
    hasHouse: boolean = false,
    hasHotel: boolean = false
  ): number {
    const properties = player.properties.get(color);
    if (!properties || properties.length === 0) {
      return 0;
    }

    const propertyCount = properties.length;
    return calculateRent(color, propertyCount, hasHouse, hasHotel);
  }

  /**
   * Check if a property set has house or hotel
   */
  static hasBuilding(player: Player, color: PropertyColor, buildingType: 'HOUSE' | 'HOTEL'): boolean {
    const properties = player.properties.get(color);
    if (!properties) {
      return false;
    }

    return properties.some(p => {
      if (p instanceof PropertyCard) {
        const prop = p as any;
        return buildingType === 'HOUSE' ? prop.hasHouse : prop.hasHotel;
      }
      return false;
    });
  }
}

// Made with Bob