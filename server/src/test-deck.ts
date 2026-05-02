import { CardFactory } from './game/CardFactory';
import { CardCategory } from 'shared';

/**
 * Test script to verify deck loading
 * Validates that all 106 cards are parsed and instantiated correctly
 */
function testDeckLoading() {
  console.log('=== Testing Deck Loading ===\n');

  try {
    // Load deck
    const deck = CardFactory.createDeck('../carddata.csv');

    console.log(`✓ Total cards loaded: ${deck.length}`);
    
    if (deck.length !== 106) {
      console.error(`✗ ERROR: Expected 106 cards, got ${deck.length}`);
      process.exit(1);
    }

    // Count cards by category
    const categoryCounts: Record<string, number> = {};
    for (const card of deck) {
      categoryCounts[card.category] = (categoryCounts[card.category] || 0) + 1;
    }

    console.log('\n=== Card Distribution by Category ===');
    for (const [category, count] of Object.entries(categoryCounts)) {
      console.log(`  ${category}: ${count} cards`);
    }

    // Verify specific card types
    console.log('\n=== Verifying Special Cards ===');

    // Check for 10-Color Wildcards (should have value 0)
    const wild10Color = deck.filter(c => 
      c.category === CardCategory.PROPERTY_WILDCARD && 
      c.name.includes('10-Color')
    );
    console.log(`✓ 10-Color Wildcards found: ${wild10Color.length}`);
    for (const card of wild10Color) {
      if (card.monetaryValue !== 0) {
        console.error(`✗ ERROR: 10-Color Wildcard has non-zero value: ${card.monetaryValue}`);
        process.exit(1);
      }
      console.log(`  - ${card.name}: value=${card.monetaryValue} (correct)`);
    }

    // Check for Just Say No cards
    const justSayNo = deck.filter(c => c.name.includes('Just Say No'));
    console.log(`✓ Just Say No cards found: ${justSayNo.length}`);

    // Check for Money cards
    const moneyCards = deck.filter(c => c.category === CardCategory.MONEY);
    console.log(`✓ Money cards found: ${moneyCards.length}`);

    // Check for Property cards
    const propertyCards = deck.filter(c => c.category === CardCategory.PROPERTY);
    console.log(`✓ Property cards found: ${propertyCards.length}`);

    // Check for Rent cards
    const rentCards = deck.filter(c => c.category === CardCategory.RENT);
    console.log(`✓ Rent cards found: ${rentCards.length}`);

    // Check for Action cards
    const actionCards = deck.filter(c => c.category === CardCategory.ACTION);
    console.log(`✓ Action cards found: ${actionCards.length}`);

    // Verify all cards have valid IDs
    console.log('\n=== Verifying Card IDs ===');
    const ids = new Set<string>();
    for (const card of deck) {
      if (!card.id) {
        console.error(`✗ ERROR: Card missing ID: ${card.name}`);
        process.exit(1);
      }
      if (ids.has(card.id)) {
        console.error(`✗ ERROR: Duplicate card ID: ${card.id}`);
        process.exit(1);
      }
      ids.add(card.id);
    }
    console.log(`✓ All ${deck.length} cards have unique IDs`);

    // Verify monetary values
    console.log('\n=== Verifying Monetary Values ===');
    let invalidValues = 0;
    for (const card of deck) {
      if (card.monetaryValue < 0) {
        console.error(`✗ ERROR: Card has negative value: ${card.name} = ${card.monetaryValue}`);
        invalidValues++;
      }
    }
    if (invalidValues === 0) {
      console.log(`✓ All cards have valid monetary values`);
    } else {
      console.error(`✗ Found ${invalidValues} cards with invalid values`);
      process.exit(1);
    }

    console.log('\n=== All Tests Passed! ===');
    console.log('✓ Deck loaded successfully');
    console.log('✓ All 106 cards validated');
    console.log('✓ Ready for game initialization\n');

  } catch (error) {
    console.error('\n✗ ERROR during deck loading:');
    console.error(error);
    process.exit(1);
  }
}

// Run test
testDeckLoading();

// Made with Bob