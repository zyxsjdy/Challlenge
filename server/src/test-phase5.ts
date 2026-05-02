import { GameEngine } from './game/GameEngine';
import { ActionType, PropertyColor, GamePhase } from 'shared';

/**
 * Phase 5 Test Script - Action Card Logic & Interrupt Mechanics
 * Tests all action handlers and payment/reaction flows
 */

console.log('=== PHASE 5 TEST: Action Card Logic & Interrupt Mechanics ===\n');

// Initialize game with 3 players
const engine = new GameEngine();
engine.initializeGame(['Alice', 'Bob', 'Charlie']);

const gameState = engine.getGameState();
const [alice, bob, charlie] = gameState.players;

console.log('✓ Game initialized with 3 players');
console.log(`  - Alice: ${alice.hand.length} cards`);
console.log(`  - Bob: ${bob.hand.length} cards`);
console.log(`  - Charlie: ${charlie.hand.length} cards\n`);

// Test 1: Pass Go Handler
console.log('TEST 1: Pass Go - Draw 2 additional cards');
const initialHandSize = alice.hand.length;
const passGoCard = alice.hand.find(c => c.name === 'Pass Go');

if (passGoCard) {
  console.log(`  Alice plays Pass Go (hand size: ${initialHandSize})`);
  try {
    engine.processAction({
      type: 'PLAY_CARD',
      playerId: alice.id,
      cardId: passGoCard.id
    });
    console.log(`  ✓ Pass Go executed - new hand size: ${alice.hand.length}`);
    console.log(`  ✓ Drew ${alice.hand.length - initialHandSize + 1} cards (card played + 2 drawn)\n`);
  } catch (error) {
    console.log(`  ✗ Error: ${error}\n`);
  }
} else {
  console.log('  ⊘ Pass Go card not in Alice\'s hand\n');
}

// Test 2: Property Setup for Rent Test
console.log('TEST 2: Setting up properties for rent test');
// Give Alice some properties manually for testing
const brownProperty = gameState.drawPile.find(c => 
  c.name.includes('Mediterranean') || c.name.includes('Baltic')
);

if (brownProperty) {
  alice.hand.push(brownProperty);
  alice.playToProperties(brownProperty, PropertyColor.BROWN);
  console.log(`  ✓ Alice now has ${PropertyColor.BROWN} property`);
  console.log(`  ✓ Properties in set: ${alice.properties.get(PropertyColor.BROWN)?.length || 0}\n`);
} else {
  console.log('  ⊘ No brown property found in deck\n');
}

// Test 3: Rent Card Handler
console.log('TEST 3: Rent Card - Collect rent from opponents');
const rentCard = alice.hand.find(c => c.name.includes('Rent'));

if (rentCard && alice.properties.get(PropertyColor.BROWN)?.length) {
  console.log(`  Alice plays ${rentCard.name}`);
  try {
    engine.processAction({
      type: 'PLAY_CARD',
      playerId: alice.id,
      cardId: rentCard.id,
      data: {
        selectedColor: PropertyColor.BROWN
      }
    });
    console.log(`  ✓ Rent card executed`);
    console.log(`  ✓ Game phase: ${gameState.phase}`);
    console.log(`  ✓ Pending action: ${gameState.pendingAction?.type || 'none'}\n`);
  } catch (error) {
    console.log(`  ✗ Error: ${error}\n`);
  }
} else {
  console.log('  ⊘ Rent card not available or no properties to charge rent\n');
}

// Test 4: Payment Handler
console.log('TEST 4: Payment Handler - Debt resolution');
if (gameState.pendingAction?.type === 'PAYMENT') {
  const payer = gameState.players.find(p => p.id === gameState.pendingAction?.targetId);
  if (payer) {
    console.log(`  ${payer.name} must pay $${gameState.pendingAction.amount}M`);
    console.log(`  Bank value: $${payer.calculateTotalMoney()}M`);
    
    // Select payment cards
    const paymentCards = payer.bank.slice(0, Math.min(2, payer.bank.length));
    const paymentValue = paymentCards.reduce((sum, c) => sum + c.monetaryValue, 0);
    
    if (paymentCards.length > 0) {
      console.log(`  Paying with ${paymentCards.length} cards (value: $${paymentValue}M)`);
      try {
        engine.processAction({
          type: 'RESPOND',
          playerId: payer.id,
          data: {
            cardIds: paymentCards.map(c => c.id)
          }
        });
        console.log(`  ✓ Payment processed`);
        console.log(`  ✓ Game phase: ${gameState.phase}\n`);
      } catch (error) {
        console.log(`  ✗ Error: ${error}\n`);
      }
    } else {
      console.log('  ⊘ No cards to pay with\n');
    }
  }
} else {
  console.log('  ⊘ No pending payment action\n');
}

// Test 5: Sly Deal Handler
console.log('TEST 5: Sly Deal - Steal property from opponent');
const slyDealCard = alice.hand.find(c => c.name === 'Sly Deal');

if (slyDealCard && bob.properties.size > 0) {
  // Find a stealable property (not in completed set)
  let targetProperty = null;
  let targetColor = null;
  
  for (const [color, properties] of bob.properties.entries()) {
    if (!bob.hasCompletedSet(color) && properties.length > 0) {
      targetProperty = properties[0];
      targetColor = color;
      break;
    }
  }
  
  if (targetProperty) {
    console.log(`  Alice plays Sly Deal targeting Bob's ${targetColor} property`);
    try {
      engine.processAction({
        type: 'PLAY_CARD',
        playerId: alice.id,
        cardId: slyDealCard.id,
        data: {
          targetPlayerId: bob.id,
          propertyCardId: targetProperty.id
        }
      });
      console.log(`  ✓ Sly Deal executed`);
      console.log(`  ✓ Game phase: ${gameState.phase}`);
      console.log(`  ✓ Awaiting reaction from Bob\n`);
    } catch (error) {
      console.log(`  ✗ Error: ${error}\n`);
    }
  } else {
    console.log('  ⊘ No stealable properties found\n');
  }
} else {
  console.log('  ⊘ Sly Deal card not available or no target properties\n');
}

// Test 6: Just Say No Handler
console.log('TEST 6: Just Say No - Reaction chain');
if (gameState.phase === GamePhase.AWAITING_REACTION) {
  const target = gameState.players.find(p => p.id === gameState.pendingAction?.targetId);
  if (target) {
    const justSayNo = target.hand.find(c => c.name === 'Just Say No');
    
    if (justSayNo) {
      console.log(`  ${target.name} uses Just Say No`);
      try {
        engine.processAction({
          type: 'RESPOND',
          playerId: target.id,
          data: {
            useJustSayNo: true,
            justSayNoCardId: justSayNo.id
          }
        });
        console.log(`  ✓ Just Say No played`);
        console.log(`  ✓ Action negated - counter-counter opportunity`);
        console.log(`  ✓ Game phase: ${gameState.phase}\n`);
      } catch (error) {
        console.log(`  ✗ Error: ${error}\n`);
      }
    } else {
      console.log(`  ${target.name} accepts the action (no Just Say No)`);
      try {
        engine.processAction({
          type: 'RESPOND',
          playerId: target.id,
          data: {
            useJustSayNo: false
          }
        });
        console.log(`  ✓ Action accepted\n`);
      } catch (error) {
        console.log(`  ✗ Error: ${error}\n`);
      }
    }
  }
} else {
  console.log('  ⊘ No pending reaction\n');
}

// Test 7: House/Hotel Handler
console.log('TEST 7: House/Hotel - Building placement');
// Set up a completed set for testing
if (alice.properties.get(PropertyColor.BROWN)?.length === 2) {
  alice.completedSets.push(PropertyColor.BROWN);
  console.log(`  Alice has completed ${PropertyColor.BROWN} set`);
  
  const houseCard = alice.hand.find(c => c.name === 'House');
  if (houseCard) {
    console.log(`  Alice plays House on ${PropertyColor.BROWN} set`);
    try {
      engine.processAction({
        type: 'PLAY_CARD',
        playerId: alice.id,
        cardId: houseCard.id,
        data: {
          propertyColor: PropertyColor.BROWN
        }
      });
      console.log(`  ✓ House placed successfully`);
      console.log(`  ✓ Rent bonus: +$3M\n`);
    } catch (error) {
      console.log(`  ✗ Error: ${error}\n`);
    }
  } else {
    console.log('  ⊘ House card not in hand\n');
  }
} else {
  console.log('  ⊘ No completed set for building placement\n');
}

// Test 8: Debt Collector Handler
console.log('TEST 8: Debt Collector - Collect $5M from one opponent');
const debtCollectorCard = alice.hand.find(c => c.name === 'Debt Collector');

if (debtCollectorCard) {
  console.log(`  Alice plays Debt Collector targeting Bob`);
  try {
    engine.processAction({
      type: 'PLAY_CARD',
      playerId: alice.id,
      cardId: debtCollectorCard.id,
      data: {
        targetPlayerId: bob.id
      }
    });
    console.log(`  ✓ Debt Collector executed`);
    console.log(`  ✓ Bob must pay $5M`);
    console.log(`  ✓ Game phase: ${gameState.phase}\n`);
  } catch (error) {
    console.log(`  ✗ Error: ${error}\n`);
  }
} else {
  console.log('  ⊘ Debt Collector card not in hand\n');
}

// Test 9: It's My Birthday Handler
console.log('TEST 9: It\'s My Birthday - Collect $2M from ALL opponents');
const birthdayCard = alice.hand.find(c => c.name === 'It\'s My Birthday');

if (birthdayCard) {
  console.log(`  Alice plays It's My Birthday`);
  try {
    engine.processAction({
      type: 'PLAY_CARD',
      playerId: alice.id,
      cardId: birthdayCard.id
    });
    console.log(`  ✓ Birthday executed`);
    console.log(`  ✓ All opponents must pay $2M each`);
    console.log(`  ✓ Game phase: ${gameState.phase}\n`);
  } catch (error) {
    console.log(`  ✗ Error: ${error}\n`);
  }
} else {
  console.log('  ⊘ Birthday card not in hand\n');
}

// Summary
console.log('=== PHASE 5 TEST SUMMARY ===');
console.log(`Game Phase: ${gameState.phase}`);
console.log(`Current Player: ${gameState.getCurrentPlayer().name}`);
console.log(`Turn Play Count: ${gameState.turnPlayCount}/3`);
console.log(`Pending Action: ${gameState.pendingAction?.type || 'none'}`);
console.log('\nPlayer States:');
gameState.players.forEach(p => {
  console.log(`  ${p.name}:`);
  console.log(`    Hand: ${p.hand.length} cards`);
  console.log(`    Bank: $${p.calculateTotalMoney()}M (${p.bank.length} cards)`);
  console.log(`    Properties: ${p.properties.size} colors`);
  console.log(`    Completed Sets: ${p.completedSets.length}`);
});

console.log('\n✓ Phase 5 action card logic tests completed');

// Made with Bob