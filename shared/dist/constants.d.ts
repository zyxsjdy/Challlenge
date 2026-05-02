import { PropertyColor } from './enums';
/**
 * Game constants defining rules and property configurations
 * Based on carddata.csv and game rules from Instruction.md
 */
export declare const GAME_CONSTANTS: {
    MIN_PLAYERS: number;
    MAX_PLAYERS: number;
    INITIAL_HAND_SIZE: number;
    NORMAL_DRAW_COUNT: number;
    EMPTY_HAND_DRAW_COUNT: number;
    MAX_HAND_SIZE: number;
    MAX_PLAYS_PER_TURN: number;
    WINNING_SET_COUNT: number;
    PROPERTY_SET_SIZES: Record<PropertyColor, number>;
    RENT_VALUES: Record<PropertyColor, number[]>;
    PROPERTY_VALUES: Record<PropertyColor, number>;
    ACTION_PAYMENTS: {
        DEBT_COLLECTOR: number;
        ITS_MY_BIRTHDAY: number;
    };
    HOUSE_VALUE: number;
    HOTEL_VALUE: number;
    HOUSE_RENT_BONUS: number;
    HOTEL_RENT_BONUS: number;
    PASS_GO_DRAW_COUNT: number;
    NO_BUILDING_COLORS: PropertyColor[];
};
/**
 * Helper function to check if a property color can have buildings
 */
export declare function canHaveBuildings(color: PropertyColor): boolean;
/**
 * Helper function to get rent value for a property set
 * @param color Property color
 * @param propertyCount Number of properties in the set
 * @param hasHouse Whether the set has a house
 * @param hasHotel Whether the set has a hotel
 */
export declare function calculateRent(color: PropertyColor, propertyCount: number, hasHouse?: boolean, hasHotel?: boolean): number;
/**
 * Helper function to check if a property set is complete
 */
export declare function isSetComplete(color: PropertyColor, propertyCount: number): boolean;
/**
 * Total number of cards in the deck (from CSV)
 */
export declare const TOTAL_CARDS = 106;
/**
 * Card distribution by category (for validation)
 */
export declare const CARD_DISTRIBUTION: {
    ACTION: number;
    PROPERTY: number;
    PROPERTY_WILDCARD: number;
    RENT: number;
    MONEY: number;
};
