import { GameState, SanitizedGameState, Card } from 'shared';

/**
 * StateSanitizer - Sanitizes game state for client consumption
 * Phase 4: Networking & Real-Time Sync
 * 
 * Hides sensitive information from opponents:
 * - Opponent hand cards (shows count only)
 * - Draw pile sequence (shows count only)
 * - Full discard pile (shows top card only)
 */
export class StateSanitizer {
  /**
   * Sanitize game state for a specific player's perspective
   * @param gameState - Full server-side game state
   * @param playerId - ID of player requesting state
   * @returns Sanitized state safe for client consumption
   */
  static sanitizeForPlayer(gameState: GameState, playerId: string): SanitizedGameState {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Sanitize player data
    const sanitizedPlayers = gameState.players.map(player => {
      const isRequestingPlayer = player.id === playerId;
      
      return {
        id: player.id,
        name: player.name,
        handCount: player.hand.length,
        bank: player.bank, // Bank is always visible
        properties: player.properties, // Properties are always visible
        completedSets: player.completedSets,
      };
    });

    // Get requesting player's hand (only for them)
    const requestingPlayer = gameState.players.find(p => p.id === playerId);
    const myHand = requestingPlayer ? requestingPlayer.hand : undefined;

    // Get top card of discard pile (or null if empty)
    const discardPileTop = gameState.discardPile.length > 0 
      ? gameState.discardPile[gameState.discardPile.length - 1] 
      : null;

    return {
      players: sanitizedPlayers,
      currentPlayerId: currentPlayer.id,
      phase: gameState.phase,
      turnPlayCount: gameState.turnPlayCount,
      drawPileCount: gameState.drawPile.length,
      discardPileTop,
      pendingAction: gameState.pendingAction,
      winner: gameState.winner,
      myHand, // Only included for requesting player
    };
  }

  /**
   * Validate that sanitized state doesn't leak sensitive information
   * Used in development/testing to ensure proper sanitization
   */
  static validateSanitization(sanitizedState: SanitizedGameState, playerId: string): boolean {
    // Check that only the requesting player has hand data
    for (const player of sanitizedState.players) {
      if (player.id !== playerId) {
        // Opponent players should not have hand property
        if ('hand' in player) {
          console.error(`Sanitization error: Opponent ${player.id} has hand data exposed`);
          return false;
        }
      }
    }

    // Check that myHand is only present if player exists
    if (sanitizedState.myHand !== undefined) {
      const playerExists = sanitizedState.players.some(p => p.id === playerId);
      if (!playerExists) {
        console.error('Sanitization error: myHand present but player not in game');
        return false;
      }
    }

    return true;
  }

  /**
   * Create a minimal state update for specific events
   * Used for targeted updates instead of full state broadcasts
   */
  static createPartialUpdate(
    gameState: GameState,
    updateType: 'TURN_CHANGE' | 'CARD_PLAYED' | 'PHASE_CHANGE',
    playerId: string
  ): Partial<SanitizedGameState> {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    switch (updateType) {
      case 'TURN_CHANGE':
        return {
          currentPlayerId: currentPlayer.id,
          turnPlayCount: gameState.turnPlayCount,
          phase: gameState.phase,
        };

      case 'CARD_PLAYED':
        const requestingPlayer = gameState.players.find(p => p.id === playerId);
        return {
          turnPlayCount: gameState.turnPlayCount,
          myHand: requestingPlayer?.hand,
          players: gameState.players.map(p => ({
            id: p.id,
            name: p.name,
            handCount: p.hand.length,
            bank: p.bank,
            properties: p.properties,
            completedSets: p.completedSets,
          })),
        };

      case 'PHASE_CHANGE':
        return {
          phase: gameState.phase,
          pendingAction: gameState.pendingAction,
        };

      default:
        return {};
    }
  }
}

// Made with Bob