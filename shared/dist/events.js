"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerEvents = exports.ClientEvents = void 0;
// ============================================================================
// EVENT NAME CONSTANTS
// ============================================================================
exports.ClientEvents = {
    JOIN_GAME: 'join_game',
    START_GAME: 'start_game',
    PLAY_CARD: 'play_card',
    END_TURN: 'end_turn',
    SELECT_TARGET: 'select_target',
    SELECT_PAYMENT: 'select_payment',
    REACT_TO_ACTION: 'react_to_action',
    MOVE_WILDCARD: 'move_wildcard',
    DISCARD_CARDS: 'discard_cards',
};
exports.ServerEvents = {
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
};
// Made with Bob
