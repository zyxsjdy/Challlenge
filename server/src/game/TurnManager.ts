import { GameState } from 'shared';
import { GamePhase } from 'shared';
import { GAME_CONSTANTS } from 'shared';

/**
 * TurnManager - Handles turn lifecycle and validation
 * Manages turn start/end, card drawing, and play limits
 */
export class TurnManager {
  /**
   * Start a new turn for the current player
   * - Draw 5 cards if hand is empty, otherwise draw 2
   * - Reset turn play count to 0
   */
  startTurn(gameState: GameState): void {
    const player = gameState.getCurrentPlayer();
    
    // Determine draw count based on hand size
    const drawCount = player.hand.length === 0 
      ? GAME_CONSTANTS.EMPTY_HAND_DRAW_COUNT 
      : GAME_CONSTANTS.NORMAL_DRAW_COUNT;
    
    // Draw cards for the turn
    gameState.drawCards(player, drawCount);
    
    // Reset play count for new turn
    gameState.turnPlayCount = 0;
    
    // Set phase to playing
    gameState.phase = GamePhase.PLAYING;
    
    console.log(`Turn started for ${player.name}: drew ${drawCount} cards, hand size: ${player.hand.length}`);
  }

  /**
   * End the current player's turn
   * - Enforce 7-card hand limit (must discard if over)
   * - Advance to next player if hand limit satisfied
   */
  endTurn(gameState: GameState): void {
    const player = gameState.getCurrentPlayer();
    
    // Check 7-card hand limit
    if (player.hand.length > GAME_CONSTANTS.MAX_HAND_SIZE) {
      // Player must discard down to 7 cards
      gameState.phase = GamePhase.AWAITING_DISCARD;
      console.log(`${player.name} must discard ${player.hand.length - GAME_CONSTANTS.MAX_HAND_SIZE} cards`);
      return;
    }
    
    // Check win condition before advancing turn
    const winner = gameState.checkWinCondition();
    if (winner) {
      console.log(`${winner.name} wins with ${winner.countCompletedSets()} completed sets!`);
      return; // Game is over, don't advance turn
    }
    
    // Advance to next player's turn
    gameState.nextTurn();
    
    console.log(`Turn ended for ${player.name}, advancing to next player`);
  }

  /**
   * Check if current player can play another card this turn
   * - Returns false if 3-card play limit reached
   * - Just Say No and wildcard color changes don't count toward limit
   */
  canPlayCard(gameState: GameState): boolean {
    return gameState.turnPlayCount < GAME_CONSTANTS.MAX_PLAYS_PER_TURN;
  }

  /**
   * Handle discarding cards when over hand limit
   * @param gameState Current game state
   * @param cardIds Array of card IDs to discard
   */
  discardCards(gameState: GameState, cardIds: string[]): void {
    const player = gameState.getCurrentPlayer();
    
    // Validate discard count
    const excessCards = player.hand.length - GAME_CONSTANTS.MAX_HAND_SIZE;
    if (cardIds.length !== excessCards) {
      throw new Error(`Must discard exactly ${excessCards} cards`);
    }
    
    // Move cards from hand to discard pile
    for (const cardId of cardIds) {
      const card = player.removeFromHand(cardId);
      if (!card) {
        throw new Error(`Card ${cardId} not found in hand`);
      }
      gameState.discardPile.push(card);
    }
    
    // Resume normal play after discarding
    gameState.phase = GamePhase.PLAYING;
    
    console.log(`${player.name} discarded ${cardIds.length} cards`);
  }
}

// Made with Bob