import { GameState, Card, ActionCard, Player } from 'shared';
import { GamePhase, ActionType } from 'shared';
import { PaymentHandler } from './PaymentHandler';
import { SlyDealHandler, ForceDealHandler, DealBreakerHandler } from './StealHandlers';

/**
 * Data for reaction response
 */
export interface ReactionData {
  useJustSayNo: boolean;
  justSayNoCardId?: string;
}

/**
 * ReactionHandler - Manages Just Say No interrupt chains
 * Handles action negation and counter-counter mechanics
 */
export class ReactionHandler {
  private paymentHandler: PaymentHandler;

  constructor() {
    this.paymentHandler = new PaymentHandler();
  }

  /**
   * Prompt a player for reaction to an action
   * Checks if player has Just Say No card
   */
  promptReaction(gameState: GameState, targetId: string): void {
    const target = this.getPlayer(gameState, targetId);
    
    // Check if player has Just Say No card
    const hasJustSayNo = target.hand.some((c: Card) => 
      c instanceof ActionCard && c.actionType === ActionType.JUST_SAY_NO
    );

    gameState.phase = GamePhase.AWAITING_REACTION;
    
    // Store whether player can counter
    if (gameState.pendingAction) {
      (gameState.pendingAction as any).canCounter = hasJustSayNo;
    }
  }

  /**
   * Handle player's reaction response
   * Either executes action or flips to counter-counter
   */
  handleReaction(gameState: GameState, targetId: string, data: ReactionData): void {
    if (!gameState.pendingAction) {
      throw new Error('No pending action to react to');
    }

    if (gameState.pendingAction.targetId !== targetId) {
      throw new Error('Not the target of this action');
    }

    const target = this.getPlayer(gameState, targetId);

    if (!data.useJustSayNo) {
      // Player accepts the action - resolve it
      this.resolveAction(gameState);
      return;
    }

    // Player uses Just Say No
    if (!data.justSayNoCardId) {
      throw new Error('Must provide justSayNoCardId when using Just Say No');
    }

    // Validate player has the card
    const cardIndex = target.hand.findIndex((c: Card) => c.id === data.justSayNoCardId);
    if (cardIndex === -1) {
      throw new Error('Just Say No card not found in hand');
    }

    const card = target.hand[cardIndex];
    if (!(card instanceof ActionCard) || card.actionType !== ActionType.JUST_SAY_NO) {
      throw new Error('Card is not a Just Say No');
    }

    // Remove Just Say No from hand and discard it
    target.hand.splice(cardIndex, 1);
    gameState.discardPile.push(card);

    // Flip the action - original initiator becomes target
    const originalInitiator = gameState.pendingAction.initiatorId;
    const originalTarget = gameState.pendingAction.targetId;

    gameState.pendingAction.initiatorId = originalTarget!;
    gameState.pendingAction.targetId = originalInitiator;

    // Prompt original initiator for counter-counter
    this.promptReaction(gameState, originalInitiator);
  }

  /**
   * Resolve the pending action (no Just Say No used or chain ended)
   */
  private resolveAction(gameState: GameState): void {
    if (!gameState.pendingAction) {
      throw new Error('No pending action to resolve');
    }

    const action = gameState.pendingAction;

    switch (action.type) {
      case 'PAYMENT':
        // Request payment from target
        this.paymentHandler.requestPayment(
          gameState,
          action.targetId!,
          action.amount!,
          action.initiatorId
        );
        break;

      case 'REACTION':
        // Resolve steal actions
        this.resolveStealAction(gameState, action);
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Resolve steal actions (Sly Deal, Force Deal, Deal Breaker)
   */
  private resolveStealAction(gameState: GameState, action: any): void {
    const stealData = action.stealData;
    const swapData = action.swapData;
    const dealBreakerData = action.dealBreakerData;

    if (stealData) {
      // Sly Deal
      SlyDealHandler.executeTransfer(
        gameState,
        action.initiatorId,
        action.targetId,
        stealData.propertyCardId,
        stealData.propertyColor
      );
    } else if (swapData) {
      // Force Deal
      ForceDealHandler.executeSwap(
        gameState,
        action.initiatorId,
        action.targetId,
        swapData.myPropertyCardId,
        swapData.myPropertyColor,
        swapData.theirPropertyCardId,
        swapData.theirPropertyColor
      );
    } else if (dealBreakerData) {
      // Deal Breaker
      DealBreakerHandler.executeTransfer(
        gameState,
        action.initiatorId,
        action.targetId,
        dealBreakerData.propertyColor
      );
    }

    // Clear pending action and return to playing
    gameState.phase = GamePhase.PLAYING;
    gameState.pendingAction = null;
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
   * Check if a player can counter an action
   */
  static canCounter(player: Player): boolean {
    return player.hand.some((c: Card) => 
      c instanceof ActionCard && c.actionType === ActionType.JUST_SAY_NO
    );
  }

  /**
   * Get Just Say No cards from player's hand
   */
  static getJustSayNoCards(player: Player): ActionCard[] {
    return player.hand.filter((c: Card) => 
      c instanceof ActionCard && c.actionType === ActionType.JUST_SAY_NO
    ) as ActionCard[];
  }
}

// Made with Bob