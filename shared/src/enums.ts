/**
 * Game phase states for state machine management
 */
export enum GamePhase {
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  PLAYING = 'PLAYING',
  AWAITING_TARGET = 'AWAITING_TARGET',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  AWAITING_REACTION = 'AWAITING_REACTION',
  AWAITING_DISCARD = 'AWAITING_DISCARD',
  GAME_OVER = 'GAME_OVER'
}

/**
 * Card categories for routing logic
 */
export enum CardCategory {
  MONEY = 'MONEY',
  PROPERTY = 'PROPERTY',
  PROPERTY_WILDCARD = 'PROPERTY_WILDCARD',
  ACTION = 'ACTION',
  RENT = 'RENT'
}

/**
 * Property colors including special types
 */
export enum PropertyColor {
  BROWN = 'BROWN',
  LIGHT_BLUE = 'LIGHT_BLUE',
  PURPLE = 'PURPLE',
  ORANGE = 'ORANGE',
  RED = 'RED',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  DARK_BLUE = 'DARK_BLUE',
  RAILROAD = 'RAILROAD',
  UTILITY = 'UTILITY',
  WILD_10_COLOR = 'WILD_10_COLOR'
}

/**
 * Action card types for game mechanics
 */
export enum ActionType {
  DEAL_BREAKER = 'DEAL_BREAKER',
  JUST_SAY_NO = 'JUST_SAY_NO',
  SLY_DEAL = 'SLY_DEAL',
  FORCE_DEAL = 'FORCE_DEAL',
  DEBT_COLLECTOR = 'DEBT_COLLECTOR',
  ITS_MY_BIRTHDAY = 'ITS_MY_BIRTHDAY',
  PASS_GO = 'PASS_GO',
  HOUSE = 'HOUSE',
  HOTEL = 'HOTEL',
  DOUBLE_THE_RENT = 'DOUBLE_THE_RENT'
}

// Made with Bob
