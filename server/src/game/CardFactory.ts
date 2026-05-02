import {
  Card,
  MoneyCard,
  PropertyCard,
  PropertyWildcard,
  ActionCard,
  RentCard
} from 'shared';
import { CardCategory, PropertyColor, ActionType } from 'shared';
import { CSVParser, RawCardData } from '../utils/csvParser';

/**
 * CardFactory - Converts raw CSV data into typed Card objects
 * Handles all card categories and special cases (10-Color Wildcard, etc.)
 */
export class CardFactory {
  /**
   * Create a Card instance from raw CSV data
   */
  static createCard(rawData: RawCardData): Card {
    const category = rawData.category.trim();
    
    switch (category) {
      case 'Money':
        return this.createMoneyCard(rawData);
      
      case 'Property':
        return this.createPropertyCard(rawData);
      
      case 'Property Wildcard':
        return this.createPropertyWildcard(rawData);
      
      case 'Action':
        return this.createActionCard(rawData);
      
      case 'Rent':
        return this.createRentCard(rawData);
      
      default:
        throw new Error(`Unknown card category: ${category}`);
    }
  }

  /**
   * Create MoneyCard from raw data
   */
  private static createMoneyCard(rawData: RawCardData): MoneyCard {
    return new MoneyCard(
      rawData.id,
      rawData.name,
      rawData.value
    );
  }

  /**
   * Create PropertyCard from raw data
   */
  private static createPropertyCard(rawData: RawCardData): PropertyCard {
    const color = this.parsePropertyColor(rawData.name);
    const fullSetSize = rawData.fullSetNumber || 0;
    const rentValues = rawData.rentValue || [];
    
    return new PropertyCard(
      rawData.id,
      rawData.name,
      rawData.value,
      color,
      fullSetSize,
      rentValues
    );
  }

  /**
   * Create PropertyWildcard from raw data
   * CRITICAL: 10-Color Wildcard has value 0 and all colors
   */
  private static createPropertyWildcard(rawData: RawCardData): PropertyWildcard {
    const name = rawData.name.trim();
    
    // Check if it's the 10-Color Multi-Color wildcard
    if (name.includes('10-Color')) {
      // 10-Color wildcard can be any color
      const allColors = [
        PropertyColor.BROWN,
        PropertyColor.LIGHT_BLUE,
        PropertyColor.PURPLE,
        PropertyColor.ORANGE,
        PropertyColor.RED,
        PropertyColor.YELLOW,
        PropertyColor.GREEN,
        PropertyColor.DARK_BLUE,
        PropertyColor.RAILROAD,
        PropertyColor.UTILITY
      ];
      
      return new PropertyWildcard(
        rawData.id,
        name,
        0, // CRITICAL: 10-Color has NO monetary value
        allColors
      );
    }
    
    // Dual-color wildcard (e.g., "Purple & Orange")
    const colors = this.parseDualColors(name);
    
    return new PropertyWildcard(
      rawData.id,
      name,
      rawData.value,
      colors
    );
  }

  /**
   * Create ActionCard from raw data
   */
  private static createActionCard(rawData: RawCardData): ActionCard {
    const name = rawData.name.trim();
    const actionType = this.parseActionType(name);
    const requiresTarget = this.actionRequiresTarget(actionType);
    
    return new ActionCard(
      rawData.id,
      name,
      rawData.value,
      actionType,
      rawData.function,
      requiresTarget
    );
  }

  /**
   * Create RentCard from raw data
   */
  private static createRentCard(rawData: RawCardData): RentCard {
    const name = rawData.name.trim();
    
    // Check if it's 10-Color Wild Rent
    const isWild = name.includes('10-Color');
    
    let validColors: PropertyColor[];
    
    if (isWild) {
      // 10-Color Wild Rent can charge for any color
      validColors = [
        PropertyColor.BROWN,
        PropertyColor.LIGHT_BLUE,
        PropertyColor.PURPLE,
        PropertyColor.ORANGE,
        PropertyColor.RED,
        PropertyColor.YELLOW,
        PropertyColor.GREEN,
        PropertyColor.DARK_BLUE,
        PropertyColor.RAILROAD,
        PropertyColor.UTILITY
      ];
    } else {
      // Dual-color rent card (e.g., "Purple & Orange")
      validColors = this.parseDualColors(name);
    }
    
    return new RentCard(
      rawData.id,
      name,
      rawData.value,
      validColors,
      isWild
    );
  }

  /**
   * Parse property color from card name
   */
  private static parsePropertyColor(name: string): PropertyColor {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('brown')) return PropertyColor.BROWN;
    if (nameLower.includes('light blue')) return PropertyColor.LIGHT_BLUE;
    if (nameLower.includes('purple')) return PropertyColor.PURPLE;
    if (nameLower.includes('orange')) return PropertyColor.ORANGE;
    if (nameLower.includes('red')) return PropertyColor.RED;
    if (nameLower.includes('yellow')) return PropertyColor.YELLOW;
    if (nameLower.includes('green')) return PropertyColor.GREEN;
    if (nameLower.includes('dark blue')) return PropertyColor.DARK_BLUE;
    if (nameLower.includes('railroad')) return PropertyColor.RAILROAD;
    if (nameLower.includes('utility')) return PropertyColor.UTILITY;
    
    throw new Error(`Cannot parse property color from: ${name}`);
  }

  /**
   * Parse dual colors from wildcard/rent card name (e.g., "Purple & Orange")
   */
  private static parseDualColors(name: string): PropertyColor[] {
    const colors: PropertyColor[] = [];
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('brown')) colors.push(PropertyColor.BROWN);
    if (nameLower.includes('light blue')) colors.push(PropertyColor.LIGHT_BLUE);
    if (nameLower.includes('purple')) colors.push(PropertyColor.PURPLE);
    if (nameLower.includes('orange')) colors.push(PropertyColor.ORANGE);
    if (nameLower.includes('red')) colors.push(PropertyColor.RED);
    if (nameLower.includes('yellow')) colors.push(PropertyColor.YELLOW);
    if (nameLower.includes('green')) colors.push(PropertyColor.GREEN);
    if (nameLower.includes('dark blue')) colors.push(PropertyColor.DARK_BLUE);
    if (nameLower.includes('railroad')) colors.push(PropertyColor.RAILROAD);
    if (nameLower.includes('utility')) colors.push(PropertyColor.UTILITY);
    
    if (colors.length === 0) {
      throw new Error(`Cannot parse colors from: ${name}`);
    }
    
    return colors;
  }

  /**
   * Parse ActionType from card name
   */
  private static parseActionType(name: string): ActionType {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('deal breaker')) return ActionType.DEAL_BREAKER;
    if (nameLower.includes('just say no')) return ActionType.JUST_SAY_NO;
    if (nameLower.includes('sly deal')) return ActionType.SLY_DEAL;
    if (nameLower.includes('force deal')) return ActionType.FORCE_DEAL;
    if (nameLower.includes('debt collector')) return ActionType.DEBT_COLLECTOR;
    if (nameLower.includes('birthday')) return ActionType.ITS_MY_BIRTHDAY;
    if (nameLower.includes('pass go')) return ActionType.PASS_GO;
    if (nameLower.includes('house')) return ActionType.HOUSE;
    if (nameLower.includes('hotel')) return ActionType.HOTEL;
    if (nameLower.includes('double')) return ActionType.DOUBLE_THE_RENT;
    
    throw new Error(`Cannot parse action type from: ${name}`);
  }

  /**
   * Determine if action requires target player selection
   */
  private static actionRequiresTarget(actionType: ActionType): boolean {
    switch (actionType) {
      case ActionType.DEAL_BREAKER:
      case ActionType.SLY_DEAL:
      case ActionType.FORCE_DEAL:
      case ActionType.DEBT_COLLECTOR:
        return true;
      
      case ActionType.JUST_SAY_NO:
      case ActionType.ITS_MY_BIRTHDAY:
      case ActionType.PASS_GO:
      case ActionType.HOUSE:
      case ActionType.HOTEL:
      case ActionType.DOUBLE_THE_RENT:
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Load and create full deck from CSV
   * @param csvPath - Path to carddata.csv (relative to project root)
   * @returns Array of 106 Card objects
   */
  static createDeck(csvPath: string = '../carddata.csv'): Card[] {
    const rawCards = CSVParser.parse(csvPath);
    const deck = rawCards.map(raw => this.createCard(raw));
    
    console.log(`Created deck with ${deck.length} cards`);
    
    // Log card distribution for verification
    const distribution = this.getCardDistribution(deck);
    console.log('Card distribution:', distribution);
    
    return deck;
  }

  /**
   * Get card distribution by category for verification
   */
  private static getCardDistribution(deck: Card[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const card of deck) {
      const category = card.category;
      distribution[category] = (distribution[category] || 0) + 1;
    }
    
    return distribution;
  }
}

// Made with Bob