import { Card, PendingAction, SanitizedGameState } from './types';
import { PropertyColor } from './enums';

/**
 * Socket.IO Event Definitions for Client-Server Communication
 * Phase 4: Networking & Real-Time Sync
 */

// ============================================================================
// CLIENT → SERVER EVENTS
// ============================================================================

/**
 * Player joins the game
 */
export interface JoinGamePayload {
  playerName: string;
}

/**
 * Player plays a card from hand
 */
export interface PlayCardPayload {
  cardId: string;
  targetColor?: PropertyColor; // For property/wildcard placement
}

/**
 * Player ends their turn
 */
export interface EndTurnPayload {
  // No payload needed - server validates current player
}

/**
 * Player selects target for action card (Sly Deal, Deal Breaker, etc.)
 */
export interface SelectTargetPayload {
  targetPlayerId: string;
  propertyColor?: PropertyColor; // For Deal Breaker, House, Hotel
  propertyCardId?: string; // For Sly Deal
  myPropertyCardId?: string; // For Force Deal (my property)
  theirPropertyCardId?: string; // For Force Deal (their property)
}

/**
 * Player selects cards to pay debt
 */
export interface SelectPaymentPayload {
  cardIds: string[]; // Cards from bank/properties to pay
}

/**
 * Player reacts to an action (Just Say No)
 */
export interface ReactToActionPayload {
  useJustSayNo: boolean;
  justSayNoCardId?: string; // If using Just Say No
}

/**
 * Player moves wildcard between property sets
 */
export interface MoveWildcardPayload {
  cardId: string;
  fromColor: PropertyColor;
  toColor: PropertyColor;
}

/**
 * Player discards cards when hand exceeds 7 at turn end
 */
export interface DiscardCardsPayload {
  cardIds: string[]; // Cards to discard
}

// ============================================================================
// SERVER → CLIENT EVENTS
// ============================================================================

/**
 * Full game state update (sanitized per player)
 */
export interface GameStateUpdatePayload {
  state: SanitizedGameState;
}

/**
 * New player joined notification
 */
export interface PlayerJoinedPayload {
  playerId: string;
  playerName: string;
  playerCount: number;
}

/**
 * Turn started notification
 */
export interface TurnStartedPayload {
  playerId: string;
  playerName: string;
  cardsDrawn: number;
}

/**
 * Card played animation trigger
 */
export interface CardPlayedPayload {
  playerId: string;
  cardId: string;
  cardName: string;
  targetColor?: PropertyColor;
}

/**
 * Action requires target selection
 */
export interface ActionRequiresTargetPayload {
  actionType: string;
  validTargets: string[]; // Player IDs
  requiresPropertySelection?: boolean;
}

/**
 * Payment required from player
 */
export interface PaymentRequiredPayload {
  amount: number;
  fromPlayerId: string;
  toPlayerId: string;
  reason: string; // "Rent", "Debt Collector", etc.
}

/**
 * Reaction prompt (Just Say No opportunity)
 */
export interface ReactionPromptPayload {
  actionType: string;
  initiatorId: string;
  targetId: string;
  canCounter: boolean; // Whether target has Just Say No card
  timeoutSeconds: number;
}

/**
 * Action card executed notification
 */
export interface ActionExecutedPayload {
  playerId: string;
  actionType: string;
  targetPlayerId?: string;
  details?: any; // Action-specific details
}

/**
 * Property stolen notification
 */
export interface PropertyStolenPayload {
  fromPlayerId: string;
  toPlayerId: string;
  propertyCardId: string;
  propertyColor: PropertyColor;
  actionType: 'SLY_DEAL' | 'DEAL_BREAKER';
}

/**
 * Properties swapped notification (Force Deal)
 */
export interface PropertiesSwappedPayload {
  player1Id: string;
  player2Id: string;
  property1CardId: string;
  property2CardId: string;
}

/**
 * Building placed notification (House/Hotel)
 */
export interface BuildingPlacedPayload {
  playerId: string;
  propertyColor: PropertyColor;
  buildingType: 'HOUSE' | 'HOTEL';
}

/**
 * Rent collected notification
 */
export interface RentCollectedPayload {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  propertyColor: PropertyColor;
  wasDoubled: boolean;
}

/**
 * Game over announcement
 */
export interface GameOverPayload {
  winnerId: string;
  winnerName: string;
  completedSets: PropertyColor[];
}

/**
 * Error notification
 */
export interface ErrorPayload {
  message: string;
  code?: string;
}

/**
 * Player disconnected notification
 */
export interface PlayerDisconnectedPayload {
  playerId: string;
  playerName: string;
}

/**
 * Player reconnected notification
 */
export interface PlayerReconnectedPayload {
  playerId: string;
  playerName: string;
}

// ============================================================================
// EVENT NAME CONSTANTS
// ============================================================================

export const ClientEvents = {
  JOIN_GAME: 'join_game',
  PLAY_CARD: 'play_card',
  END_TURN: 'end_turn',
  SELECT_TARGET: 'select_target',
  SELECT_PAYMENT: 'select_payment',
  REACT_TO_ACTION: 'react_to_action',
  MOVE_WILDCARD: 'move_wildcard',
  DISCARD_CARDS: 'discard_cards',
} as const;

export const ServerEvents = {
  GAME_STATE_UPDATE: 'game_state_update',
  PLAYER_JOINED: 'player_joined',
  TURN_STARTED: 'turn_started',
  CARD_PLAYED: 'card_played',
  ACTION_REQUIRES_TARGET: 'action_requires_target',
  PAYMENT_REQUIRED: 'payment_required',
  REACTION_PROMPT: 'reaction_prompt',
  ACTION_EXECUTED: 'action_executed',
  PROPERTY_STOLEN: 'property_stolen',
  PROPERTIES_SWAPPED: 'properties_swapped',
  BUILDING_PLACED: 'building_placed',
  RENT_COLLECTED: 'rent_collected',
  GAME_OVER: 'game_over',
  ERROR: 'error',
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_RECONNECTED: 'player_reconnected',
} as const;

// Type helpers for event names
export type ClientEventName = typeof ClientEvents[keyof typeof ClientEvents];
export type ServerEventName = typeof ServerEvents[keyof typeof ServerEvents];

// Made with Bob