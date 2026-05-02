import { GameState, Card, ActionCard } from 'shared';

/**
 * Base abstract class for all action card handlers
 * Provides common interface for executing action cards
 */
export abstract class ActionHandler {
  /**
   * Check if the action can be executed in the current game state
   * @param gameState Current game state
   * @param playerId Player attempting to execute the action
   * @param card Card being played
   * @returns true if action can be executed
   */
  abstract canExecute(gameState: GameState, playerId: string, card: Card): boolean;

  /**
   * Check if this action requires target selection
   * @returns true if action needs a target player
   */
  abstract requiresTarget(): boolean;

  /**
   * Execute the action card effect
   * @param gameState Current game state (will be mutated)
   * @param playerId Player executing the action
   * @param card Card being played
   * @param data Additional data (targets, selections, etc.)
   */
  abstract execute(gameState: GameState, playerId: string, card: Card, data?: any): void;

  /**
   * Get the player object from game state
   */
  protected getPlayer(gameState: GameState, playerId: string): any {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }
    return player;
  }

  /**
   * Get all opponents of a player
   */
  protected getOpponents(gameState: GameState, playerId: string): any[] {
    return gameState.players.filter(p => p.id !== playerId);
  }

  /**
   * Validate that a player exists
   */
  protected validatePlayer(gameState: GameState, playerId: string): void {
    if (!gameState.players.find(p => p.id === playerId)) {
      throw new Error(`Invalid player ID: ${playerId}`);
    }
  }
}

// Made with Bob