import { SanitizedGameState } from './types';
import { PropertyColor } from './enums';
/**
 * Socket.IO Event Definitions for Client-Server Communication
 * Phase 4: Networking & Real-Time Sync
 */
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
    targetColor?: PropertyColor;
}
/**
 * Player ends their turn
 */
export interface EndTurnPayload {
}
/**
 * Player selects target for action card (Sly Deal, Deal Breaker, etc.)
 */
export interface SelectTargetPayload {
    targetPlayerId: string;
    propertyColor?: PropertyColor;
    propertyCardId?: string;
    myPropertyCardId?: string;
    theirPropertyCardId?: string;
}
/**
 * Player selects cards to pay debt
 */
export interface SelectPaymentPayload {
    cardIds: string[];
}
/**
 * Player reacts to an action (Just Say No)
 */
export interface ReactToActionPayload {
    useJustSayNo: boolean;
    justSayNoCardId?: string;
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
    cardIds: string[];
}
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
    validTargets: string[];
    requiresPropertySelection?: boolean;
}
/**
 * Payment required from player
 */
export interface PaymentRequiredPayload {
    amount: number;
    fromPlayerId: string;
    toPlayerId: string;
    reason: string;
}
/**
 * Reaction prompt (Just Say No opportunity)
 */
export interface ReactionPromptPayload {
    actionType: string;
    initiatorId: string;
    targetId: string;
    canCounter: boolean;
    timeoutSeconds: number;
}
/**
 * Action card executed notification
 */
export interface ActionExecutedPayload {
    playerId: string;
    actionType: string;
    targetPlayerId?: string;
    details?: any;
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
export declare const ClientEvents: {
    readonly JOIN_GAME: "join_game";
    readonly START_GAME: "start_game";
    readonly PLAY_CARD: "play_card";
    readonly END_TURN: "end_turn";
    readonly SELECT_TARGET: "select_target";
    readonly SELECT_PAYMENT: "select_payment";
    readonly REACT_TO_ACTION: "react_to_action";
    readonly MOVE_WILDCARD: "move_wildcard";
    readonly DISCARD_CARDS: "discard_cards";
};
export declare const ServerEvents: {
    readonly GAME_STATE_UPDATE: "game_state_update";
    readonly PLAYER_JOINED: "player_joined";
    readonly TURN_STARTED: "turn_started";
    readonly CARD_PLAYED: "card_played";
    readonly ACTION_REQUIRES_TARGET: "action_requires_target";
    readonly PAYMENT_REQUIRED: "payment_required";
    readonly REACTION_PROMPT: "reaction_prompt";
    readonly ACTION_EXECUTED: "action_executed";
    readonly PROPERTY_STOLEN: "property_stolen";
    readonly PROPERTIES_SWAPPED: "properties_swapped";
    readonly BUILDING_PLACED: "building_placed";
    readonly RENT_COLLECTED: "rent_collected";
    readonly GAME_OVER: "game_over";
    readonly ERROR: "error";
    readonly PLAYER_DISCONNECTED: "player_disconnected";
    readonly PLAYER_RECONNECTED: "player_reconnected";
};
export type ClientEventName = typeof ClientEvents[keyof typeof ClientEvents];
export type ServerEventName = typeof ServerEvents[keyof typeof ServerEvents];
