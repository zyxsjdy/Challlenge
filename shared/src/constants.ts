import { PropertyColor } from './enums';

/**
 * Game constants defining rules and property configurations
 * Based on carddata.csv and game rules from Instruction.md
 */
export const GAME_CONSTANTS = {
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
    [PropertyColor.BROWN]: 2,
    [PropertyColor.LIGHT_BLUE]: 3,
    [PropertyColor.PURPLE]: 3,
    [PropertyColor.ORANGE]: 3,
    [PropertyColor.RED]: 3,
    [PropertyColor.YELLOW]: 3,
    [PropertyColor.GREEN]: 3,
    [PropertyColor.DARK_BLUE]: 2,
    [PropertyColor.RAILROAD]: 4,
    [PropertyColor.UTILITY]: 2,
    [PropertyColor.WILD_10_COLOR]: 0 // Not a completable set
  } as Record<PropertyColor, number>,

  // Rent values for each property color (progressive based on set completion)
  // Format: [1 property, 2 properties, 3 properties, 4 properties]
  RENT_VALUES: {
    [PropertyColor.BROWN]: [1, 2],
    [PropertyColor.LIGHT_BLUE]: [1, 2, 3],
    [PropertyColor.PURPLE]: [1, 2, 4],
    [PropertyColor.ORANGE]: [1, 3, 5],
    [PropertyColor.RED]: [2, 3, 6],
    [PropertyColor.YELLOW]: [2, 4, 6],
    [PropertyColor.GREEN]: [2, 4, 7],
    [PropertyColor.DARK_BLUE]: [3, 8],
    [PropertyColor.RAILROAD]: [1, 2, 3, 4],
    [PropertyColor.UTILITY]: [1, 2],
    [PropertyColor.WILD_10_COLOR]: [] // No rent values
  } as Record<PropertyColor, number[]>,

  // Property values (for payment purposes)
  PROPERTY_VALUES: {
    [PropertyColor.BROWN]: 1,
    [PropertyColor.LIGHT_BLUE]: 1,
    [PropertyColor.PURPLE]: 2,
    [PropertyColor.ORANGE]: 2,
    [PropertyColor.RED]: 3,
    [PropertyColor.YELLOW]: 3,
    [PropertyColor.GREEN]: 4,
    [PropertyColor.DARK_BLUE]: 4,
    [PropertyColor.RAILROAD]: 2,
    [PropertyColor.UTILITY]: 2,
    [PropertyColor.WILD_10_COLOR]: 0 // Cannot be used for payment
  } as Record<PropertyColor, number>,

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
    PropertyColor.RAILROAD,
    PropertyColor.UTILITY,
    PropertyColor.WILD_10_COLOR
  ] as PropertyColor[]
};

/**
 * Helper function to check if a property color can have buildings
 */
export function canHaveBuildings(color: PropertyColor): boolean {
  return !GAME_CONSTANTS.NO_BUILDING_COLORS.includes(color);
}

/**
 * Helper function to get rent value for a property set
 * @param color Property color
 * @param propertyCount Number of properties in the set
 * @param hasHouse Whether the set has a house
 * @param hasHotel Whether the set has a hotel
 */
export function calculateRent(
  color: PropertyColor,
  propertyCount: number,
  hasHouse: boolean = false,
  hasHotel: boolean = false
): number {
  const rentValues = GAME_CONSTANTS.RENT_VALUES[color];
  if (!rentValues || rentValues.length === 0) {
    return 0;
  }

  // Get base rent (capped at array length)
  const index = Math.min(propertyCount - 1, rentValues.length - 1);
  let rent = rentValues[Math.max(0, index)];

  // Add building bonuses
  if (hasHouse) {
    rent += GAME_CONSTANTS.HOUSE_RENT_BONUS;
  }
  if (hasHotel) {
    rent += GAME_CONSTANTS.HOTEL_RENT_BONUS;
  }

  return rent;
}

/**
 * Helper function to check if a property set is complete
 */
export function isSetComplete(color: PropertyColor, propertyCount: number): boolean {
  const requiredSize = GAME_CONSTANTS.PROPERTY_SET_SIZES[color];
  return requiredSize > 0 && propertyCount >= requiredSize;
}

/**
 * Total number of cards in the deck (from CSV)
 */
export const TOTAL_CARDS = 106;

/**
 * Card distribution by category (for validation)
 */
export const CARD_DISTRIBUTION = {
  ACTION: 34, // Includes all action cards
  PROPERTY: 28, // Standard property cards
  PROPERTY_WILDCARD: 11, // Dual-color and 10-color wildcards
  RENT: 13, // Rent cards
  MONEY: 20 // Pure money cards
};

// Made with Bob
