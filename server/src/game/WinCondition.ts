import { GameState, Player } from 'shared';
import { CardCategory, PropertyColor } from 'shared';
import { GAME_CONSTANTS } from 'shared';

/**
 * WinCondition - Handles win condition checking
 * A player wins by completing 3 unique property sets
 */
export class WinCondition {
  /**
   * Check if any player has won the game
   * @param gameState Current game state
   * @returns Winning player or null if no winner yet
   */
  check(gameState: GameState): Player | null {
    for (const player of gameState.players) {
      const uniqueCompletedSets = this.countUniqueCompletedSets(player);
      if (uniqueCompletedSets >= GAME_CONSTANTS.WINNING_SET_COUNT) {
        return player;
      }
    }
    return null;
  }

  /**
   * Count the number of unique completed property sets for a player
   * A set is complete when it has the required number of properties
   * @param player Player to check
   * @returns Number of unique completed sets
   */
  private countUniqueCompletedSets(player: Player): number {
    const completedColors = new Set<PropertyColor>();
    
    for (const [color, cards] of player.properties) {
      const setSize = GAME_CONSTANTS.PROPERTY_SET_SIZES[color];
      
      // Skip colors that can't form complete sets (like WILD_10_COLOR)
      if (setSize === 0) {
        continue;
      }
      
      // Count only property and property wildcard cards (not houses/hotels)
      const propertyCount = cards.filter(c => 
        c.category === CardCategory.PROPERTY || 
        c.category === CardCategory.PROPERTY_WILDCARD
      ).length;
      
      // Check if set is complete
      if (propertyCount >= setSize) {
        completedColors.add(color);
      }
    }
    
    return completedColors.size;
  }

  /**
   * Get detailed win status for a player
   * @param player Player to check
   * @returns Object with completed sets and progress
   */
  getWinStatus(player: Player): {
    completedSets: PropertyColor[];
    completedCount: number;
    needsToWin: number;
  } {
    const completedSets: PropertyColor[] = [];
    
    for (const [color, cards] of player.properties) {
      const setSize = GAME_CONSTANTS.PROPERTY_SET_SIZES[color];
      
      if (setSize === 0) {
        continue;
      }
      
      const propertyCount = cards.filter(c => 
        c.category === CardCategory.PROPERTY || 
        c.category === CardCategory.PROPERTY_WILDCARD
      ).length;
      
      if (propertyCount >= setSize) {
        completedSets.push(color);
      }
    }
    
    return {
      completedSets,
      completedCount: completedSets.length,
      needsToWin: Math.max(0, GAME_CONSTANTS.WINNING_SET_COUNT - completedSets.length)
    };
  }
}

// Made with Bob