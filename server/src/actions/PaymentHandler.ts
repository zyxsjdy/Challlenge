import { GameState, Card, Player, PropertyCard, PropertyWildcard, MoneyCard, ActionCard } from 'shared';
import { GamePhase, CardCategory, PropertyColor } from 'shared';

/**
 * Data for payment submission
 */
export interface PaymentData {
  cardIds: string[];
}

/**
 * PaymentHandler - Manages debt payment and card transfers
 * Handles payment validation, card routing, and overpayment rules
 */
export class PaymentHandler {
  /**
   * Request payment from a player
   * Sets game to AWAITING_PAYMENT phase
   */
  requestPayment(gameState: GameState, payerId: string, amount: number, initiatorId: string): void {
    console.log(`[PaymentHandler.requestPayment] Called with payerId: ${payerId}, amount: ${amount}, initiatorId: ${initiatorId}`);
    const payer = this.getPlayer(gameState, payerId);

    // Check if player can pay
    const payableCards = this.getPayableCards(payer);
    const totalAvailable = payableCards.reduce((sum, card) => sum + card.monetaryValue, 0);
    console.log(`[PaymentHandler.requestPayment] Player has $${totalAvailable}M available to pay`);

    if (totalAvailable === 0) {
      console.log(`[PaymentHandler.requestPayment] Player has nothing to pay with`);
      // Player has nothing to pay with - payment automatically fails
      // Check if there are remaining targets (for multi-target actions like Birthday)
      const remainingTargets = (gameState.pendingAction as any)?.remainingTargets;
      if (remainingTargets && remainingTargets.length > 0) {
        // Process next target
        const nextTarget = remainingTargets.shift();
        this.requestPayment(gameState, nextTarget, amount, initiatorId);
        (gameState.pendingAction as any).remainingTargets = remainingTargets;
      } else {
        // No more targets - clear pending action and return to playing phase
        gameState.phase = GamePhase.PLAYING;
        gameState.pendingAction = null;
      }
      return;
    }

    console.log(`[PaymentHandler.requestPayment] Setting phase to AWAITING_PAYMENT`);
    gameState.phase = GamePhase.AWAITING_PAYMENT;
    gameState.pendingAction = {
      type: 'PAYMENT',
      initiatorId: initiatorId,
      targetId: payerId,
      amount: amount
    };
    console.log(`[PaymentHandler.requestPayment] Phase set to: ${gameState.phase}, pendingAction:`, gameState.pendingAction);
  }

  /**
   * Process payment from player
   * Transfers cards to recipient and validates payment amount
   */
  processPayment(gameState: GameState, payerId: string, cardIds: string[]): void {
    if (!gameState.pendingAction || gameState.pendingAction.type !== 'PAYMENT') {
      throw new Error('No pending payment action');
    }

    if (gameState.pendingAction.targetId !== payerId) {
      throw new Error('Not the player who should be paying');
    }

    const payer = this.getPlayer(gameState, payerId);
    const recipientId = gameState.pendingAction.initiatorId;
    const recipient = this.getPlayer(gameState, recipientId);
    const requiredAmount = gameState.pendingAction.amount || 0;

    // Validate and calculate total payment value
    let totalValue = 0;
    const cardsToTransfer: Card[] = [];

    for (const cardId of cardIds) {
      const card = this.findCard(payer, cardId);
      if (!card) {
        throw new Error(`Card ${cardId} not found`);
      }

      // Validate card can be used for payment
      if (!card.canBeUsedForPayment()) {
        throw new Error(`Card ${card.name} cannot be used for payment (10-Color Wildcard has no value)`);
      }

      totalValue += card.monetaryValue;
      cardsToTransfer.push(card);
    }

    // Validate payment meets minimum requirement
    if (totalValue < requiredAmount) {
      throw new Error(`Insufficient payment: ${totalValue} < ${requiredAmount}`);
    }

    // Execute transfer (no change given for overpayment)
    for (const card of cardsToTransfer) {
      this.removeCardFromPlayer(payer, card.id);
      this.addCardToRecipient(recipient, card);
    }

    // Check if there are remaining targets (for multi-target actions like Birthday)
    const remainingTargets = (gameState.pendingAction as any)?.remainingTargets;
    if (remainingTargets && remainingTargets.length > 0) {
      // Process next target
      const nextTarget = remainingTargets.shift();
      
      // Set up reaction phase for next target
      gameState.phase = GamePhase.AWAITING_REACTION;
      gameState.pendingAction = {
        type: 'PAYMENT',
        initiatorId: recipientId,
        targetId: nextTarget,
        amount: requiredAmount,
        canBeCountered: true
      };
      (gameState.pendingAction as any).remainingTargets = remainingTargets;
    } else {
      // No more targets - clear pending action and return to playing phase
      gameState.phase = GamePhase.PLAYING;
      gameState.pendingAction = null;
    }
  }

  /**
   * Get all cards that can be used for payment
   * Excludes 10-Color Wildcard (value 0)
   */
  private getPayableCards(player: Player): Card[] {
    const payable: Card[] = [];

    // Add bank cards
    payable.push(...player.bank.filter(c => c.canBeUsedForPayment()));

    // Add properties (excluding 10-color wildcards)
    for (const properties of player.properties.values()) {
      payable.push(...properties.filter((c: Card) => c.canBeUsedForPayment()));
    }

    return payable;
  }

  /**
   * Find a card in player's possession (bank or properties)
   */
  private findCard(player: Player, cardId: string): Card | null {
    // Check bank
    const bankCard = player.bank.find(c => c.id === cardId);
    if (bankCard) {
      return bankCard;
    }

    // Check properties
    for (const properties of player.properties.values()) {
      const propCard = properties.find((c: Card) => c.id === cardId);
      if (propCard) {
        return propCard;
      }
    }

    return null;
  }

  /**
   * Remove card from player's possession
   */
  private removeCardFromPlayer(player: Player, cardId: string): void {
    // Try bank first
    const bankIndex = player.bank.findIndex(c => c.id === cardId);
    if (bankIndex !== -1) {
      player.bank.splice(bankIndex, 1);
      return;
    }

    // Try properties
    for (const [color, properties] of player.properties.entries()) {
      const propIndex = properties.findIndex((c: Card) => c.id === cardId);
      if (propIndex !== -1) {
        properties.splice(propIndex, 1);
        
        // Update completed sets after removing property
        (player as any).updateCompletedSets?.();
        return;
      }
    }

    throw new Error(`Card ${cardId} not found in player's possession`);
  }

  /**
   * Add card to recipient based on card type
   * Money/Action cards go to bank
   * Properties go to property area (maintaining color grouping)
   */
  private addCardToRecipient(recipient: Player, card: Card): void {
    if (card.category === CardCategory.MONEY || card.category === CardCategory.ACTION) {
      // Money and action cards go to bank
      recipient.bank.push(card);
    } else if (card.category === CardCategory.PROPERTY) {
      // Standard property cards
      const propCard = card as PropertyCard;
      if (!recipient.properties.has(propCard.color)) {
        recipient.properties.set(propCard.color, []);
      }
      recipient.properties.get(propCard.color)!.push(card);
      (recipient as any).updateCompletedSets?.();
    } else if (card.category === CardCategory.PROPERTY_WILDCARD) {
      // Wildcard properties - maintain current color assignment
      const wildcard = card as PropertyWildcard;
      if (wildcard.currentColor) {
        if (!recipient.properties.has(wildcard.currentColor)) {
          recipient.properties.set(wildcard.currentColor, []);
        }
        recipient.properties.get(wildcard.currentColor)!.push(card);
        (recipient as any).updateCompletedSets?.();
      } else {
        // If wildcard has no color assigned, put in bank
        recipient.bank.push(card);
      }
    } else if (card.category === CardCategory.RENT) {
      // Rent cards go to bank
      recipient.bank.push(card);
    }
  }

  /**
   * Get player from game state
   */
  private getPlayer(gameState: GameState, playerId: string): Player {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }
    return player;
  }

  /**
   * Calculate total payable value for a player
   */
  static calculatePayableValue(player: Player): number {
    let total = 0;

    // Bank cards
    total += player.bank.reduce((sum, card) => sum + card.monetaryValue, 0);

    // Properties (excluding 10-color wildcards)
    for (const properties of player.properties.values()) {
      total += properties
        .filter((c: Card) => c.canBeUsedForPayment())
        .reduce((sum: number, card: Card) => sum + card.monetaryValue, 0);
    }

    return total;
  }
}

// Made with Bob