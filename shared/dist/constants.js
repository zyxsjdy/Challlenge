"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CARD_DISTRIBUTION = exports.TOTAL_CARDS = exports.GAME_CONSTANTS = void 0;
exports.canHaveBuildings = canHaveBuildings;
exports.calculateRent = calculateRent;
exports.isSetComplete = isSetComplete;
const enums_1 = require("./enums");
/**
 * Game constants defining rules and property configurations
 * Based on carddata.csv and game rules from Instruction.md
 */
exports.GAME_CONSTANTS = {
    // Player limits
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 5,
    // Hand management
    INITIAL_HAND_SIZE: 5,
    NORMAL_DRAW_COUNT: 2,
    EMPTY_HAND_DRAW_COUNT: 5, // Draw 5 if starting turn with 0 cards
    MAX_HAND_SIZE: 7, // Must discard down to 7 at end of turn
    // Turn limits
    MAX_PLAYS_PER_TURN: 3, // Can play up to 3 cards per turn (excluding Just Say No and wildcard color changes)
    // Win condition
    WINNING_SET_COUNT: 3, // First to complete 3 different property sets wins
    // Property set sizes (number of cards needed to complete each set)
    PROPERTY_SET_SIZES: {
        [enums_1.PropertyColor.BROWN]: 2,
        [enums_1.PropertyColor.LIGHT_BLUE]: 3,
        [enums_1.PropertyColor.PURPLE]: 3,
        [enums_1.PropertyColor.ORANGE]: 3,
        [enums_1.PropertyColor.RED]: 3,
        [enums_1.PropertyColor.YELLOW]: 3,
        [enums_1.PropertyColor.GREEN]: 3,
        [enums_1.PropertyColor.DARK_BLUE]: 2,
        [enums_1.PropertyColor.RAILROAD]: 4,
        [enums_1.PropertyColor.UTILITY]: 2,
        [enums_1.PropertyColor.WILD_10_COLOR]: 0 // Not a completable set
    },
    // Rent values for each property color (progressive based on set completion)
    // Format: [1 property, 2 properties, 3 properties, 4 properties]
    RENT_VALUES: {
        [enums_1.PropertyColor.BROWN]: [1, 2],
        [enums_1.PropertyColor.LIGHT_BLUE]: [1, 2, 3],
        [enums_1.PropertyColor.PURPLE]: [1, 2, 4],
        [enums_1.PropertyColor.ORANGE]: [1, 3, 5],
        [enums_1.PropertyColor.RED]: [2, 3, 6],
        [enums_1.PropertyColor.YELLOW]: [2, 4, 6],
        [enums_1.PropertyColor.GREEN]: [2, 4, 7],
        [enums_1.PropertyColor.DARK_BLUE]: [3, 8],
        [enums_1.PropertyColor.RAILROAD]: [1, 2, 3, 4],
        [enums_1.PropertyColor.UTILITY]: [1, 2],
        [enums_1.PropertyColor.WILD_10_COLOR]: [] // No rent values
    },
    // Property values (for payment purposes)
    PROPERTY_VALUES: {
        [enums_1.PropertyColor.BROWN]: 1,
        [enums_1.PropertyColor.LIGHT_BLUE]: 1,
        [enums_1.PropertyColor.PURPLE]: 2,
        [enums_1.PropertyColor.ORANGE]: 2,
        [enums_1.PropertyColor.RED]: 3,
        [enums_1.PropertyColor.YELLOW]: 3,
        [enums_1.PropertyColor.GREEN]: 4,
        [enums_1.PropertyColor.DARK_BLUE]: 4,
        [enums_1.PropertyColor.RAILROAD]: 2,
        [enums_1.PropertyColor.UTILITY]: 2,
        [enums_1.PropertyColor.WILD_10_COLOR]: 0 // Cannot be used for payment
    },
    // Action card payment amounts
    ACTION_PAYMENTS: {
        DEBT_COLLECTOR: 5,
        ITS_MY_BIRTHDAY: 2
    },
    // House and Hotel rules
    HOUSE_VALUE: 3,
    HOTEL_VALUE: 4,
    HOUSE_RENT_BONUS: 3, // Add $3M to rent when house is present
    HOTEL_RENT_BONUS: 4, // Add $4M to rent when hotel is present
    // Special rules
    PASS_GO_DRAW_COUNT: 2, // Pass Go draws 2 extra cards
    // Property types that cannot have houses/hotels
    NO_BUILDING_COLORS: [
        enums_1.PropertyColor.RAILROAD,
        enums_1.PropertyColor.UTILITY,
        enums_1.PropertyColor.WILD_10_COLOR
    ]
};
/**
 * Helper function to check if a property color can have buildings
 */
function canHaveBuildings(color) {
    return !exports.GAME_CONSTANTS.NO_BUILDING_COLORS.includes(color);
}
/**
 * Helper function to get rent value for a property set
 * @param color Property color
 * @param propertyCount Number of properties in the set
 * @param hasHouse Whether the set has a house
 * @param hasHotel Whether the set has a hotel
 */
function calculateRent(color, propertyCount, hasHouse = false, hasHotel = false) {
    const rentValues = exports.GAME_CONSTANTS.RENT_VALUES[color];
    if (!rentValues || rentValues.length === 0) {
        return 0;
    }
    // Get base rent (capped at array length)
    const index = Math.min(propertyCount - 1, rentValues.length - 1);
    let rent = rentValues[Math.max(0, index)];
    // Add building bonuses
    if (hasHouse) {
        rent += exports.GAME_CONSTANTS.HOUSE_RENT_BONUS;
    }
    if (hasHotel) {
        rent += exports.GAME_CONSTANTS.HOTEL_RENT_BONUS;
    }
    return rent;
}
/**
 * Helper function to check if a property set is complete
 */
function isSetComplete(color, propertyCount) {
    const requiredSize = exports.GAME_CONSTANTS.PROPERTY_SET_SIZES[color];
    return requiredSize > 0 && propertyCount >= requiredSize;
}
/**
 * Total number of cards in the deck (from CSV)
 */
exports.TOTAL_CARDS = 106;
/**
 * Card distribution by category (for validation)
 */
exports.CARD_DISTRIBUTION = {
    ACTION: 34, // Includes all action cards
    PROPERTY: 28, // Standard property cards
    PROPERTY_WILDCARD: 11, // Dual-color and 10-color wildcards
    RENT: 13, // Rent cards
    MONEY: 20 // Pure money cards
};
// Made with Bob
