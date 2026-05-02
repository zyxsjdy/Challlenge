"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionType = exports.PropertyColor = exports.CardCategory = exports.GamePhase = void 0;
/**
 * Game phase states for state machine management
 */
var GamePhase;
(function (GamePhase) {
    GamePhase["WAITING_FOR_PLAYERS"] = "WAITING_FOR_PLAYERS";
    GamePhase["PLAYING"] = "PLAYING";
    GamePhase["AWAITING_TARGET"] = "AWAITING_TARGET";
    GamePhase["AWAITING_PAYMENT"] = "AWAITING_PAYMENT";
    GamePhase["AWAITING_REACTION"] = "AWAITING_REACTION";
    GamePhase["AWAITING_DISCARD"] = "AWAITING_DISCARD";
    GamePhase["GAME_OVER"] = "GAME_OVER";
})(GamePhase || (exports.GamePhase = GamePhase = {}));
/**
 * Card categories for routing logic
 */
var CardCategory;
(function (CardCategory) {
    CardCategory["MONEY"] = "MONEY";
    CardCategory["PROPERTY"] = "PROPERTY";
    CardCategory["PROPERTY_WILDCARD"] = "PROPERTY_WILDCARD";
    CardCategory["ACTION"] = "ACTION";
    CardCategory["RENT"] = "RENT";
})(CardCategory || (exports.CardCategory = CardCategory = {}));
/**
 * Property colors including special types
 */
var PropertyColor;
(function (PropertyColor) {
    PropertyColor["BROWN"] = "BROWN";
    PropertyColor["LIGHT_BLUE"] = "LIGHT_BLUE";
    PropertyColor["PURPLE"] = "PURPLE";
    PropertyColor["ORANGE"] = "ORANGE";
    PropertyColor["RED"] = "RED";
    PropertyColor["YELLOW"] = "YELLOW";
    PropertyColor["GREEN"] = "GREEN";
    PropertyColor["DARK_BLUE"] = "DARK_BLUE";
    PropertyColor["RAILROAD"] = "RAILROAD";
    PropertyColor["UTILITY"] = "UTILITY";
    PropertyColor["WILD_10_COLOR"] = "WILD_10_COLOR";
})(PropertyColor || (exports.PropertyColor = PropertyColor = {}));
/**
 * Action card types for game mechanics
 */
var ActionType;
(function (ActionType) {
    ActionType["DEAL_BREAKER"] = "DEAL_BREAKER";
    ActionType["JUST_SAY_NO"] = "JUST_SAY_NO";
    ActionType["SLY_DEAL"] = "SLY_DEAL";
    ActionType["FORCE_DEAL"] = "FORCE_DEAL";
    ActionType["DEBT_COLLECTOR"] = "DEBT_COLLECTOR";
    ActionType["ITS_MY_BIRTHDAY"] = "ITS_MY_BIRTHDAY";
    ActionType["PASS_GO"] = "PASS_GO";
    ActionType["HOUSE"] = "HOUSE";
    ActionType["HOTEL"] = "HOTEL";
    ActionType["DOUBLE_THE_RENT"] = "DOUBLE_THE_RENT";
})(ActionType || (exports.ActionType = ActionType = {}));
// Made with Bob
