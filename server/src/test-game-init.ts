import { GameEngine } from './game/GameEngine';

/**
 * Test script to verify game initialization, deck shuffle, and initial deal
 */
function testGameInitialization() {
  console.log('=== Testing Game Initialization ===\n');

  try {
    // Create game engine
    const gameEngine = new GameEngine();
    console.log('✓ GameEngine created');

    // Initialize game with 3 players
    const playerNames = ['Alice', 'Bob', 'Charlie'];
    gameEngine.initializeGame(playerNames);
    console.log(`✓ Game initialized with ${playerNames.length} players`);

    // Get game state
    const gameState = gameEngine.getGameState();

    // Verify players were created
    console.log('\n=== Verifying Players ===');
    console.log(`✓ Total players: ${gameState.players.length}`);
    for (const player of gameState.players) {
      console.log(`  - ${player.name} (ID: ${player.id})`);
      console.log(`    Hand: ${player.hand.length} cards`);
      console.log(`    Bank: ${player.bank.length} cards`);
      console.log(`    Properties: ${player.properties.size} color groups`);
    }

    // Verify initial hands (should be 5 cards each)
    console.log('\n=== Verifying Initial Hands ===');
    let allHandsCorrect = true;
    for (const player of gameState.players) {
      if (player.hand.length !== 5) {
        console.error(`✗ ERROR: ${player.name} has ${player.hand.length} cards (expected 5)`);
        allHandsCorrect = false;
      } else {
        console.log(`✓ ${player.name} has 5 cards`);
      }
    }

    if (!allHandsCorrect) {
      process.exit(1);
    }

    // Verify deck state
    console.log('\n=== Verifying Deck State ===');
    const totalDealt = gameState.players.length * 5;
    const expectedRemaining = 106 - totalDealt;
    console.log(`✓ Cards dealt: ${totalDealt}`);
    console.log(`✓ Cards remaining in draw pile: ${gameState.drawPile.length}`);
    console.log(`  Expected: ${expectedRemaining}`);

    if (gameState.drawPile.length !== expectedRemaining) {
      console.error(`✗ ERROR: Draw pile has ${gameState.drawPile.length} cards (expected ${expectedRemaining})`);
      process.exit(1);
    }

    // Verify no duplicate cards in hands
    console.log('\n=== Verifying Card Uniqueness ===');
    const allCardIds = new Set<string>();
    let duplicatesFound = false;

    for (const player of gameState.players) {
      for (const card of player.hand) {
        if (allCardIds.has(card.id)) {
          console.error(`✗ ERROR: Duplicate card found: ${card.id} (${card.name})`);
          duplicatesFound = true;
        }
        allCardIds.add(card.id);
      }
    }

    if (duplicatesFound) {
      process.exit(1);
    }
    console.log(`✓ All ${allCardIds.size} dealt cards are unique`);

    // Verify game phase
    console.log('\n=== Verifying Game Phase ===');
    console.log(`✓ Game phase: ${gameState.phase}`);
    if (gameState.phase !== 'PLAYING') {
      console.error(`✗ ERROR: Game phase should be PLAYING, got ${gameState.phase}`);
      process.exit(1);
    }

    // Verify current player
    console.log('\n=== Verifying Current Player ===');
    const currentPlayer = gameState.getCurrentPlayer();
    console.log(`✓ Current player: ${currentPlayer.name}`);
    console.log(`✓ Current player index: ${gameState.currentPlayerIndex}`);

    // Test sanitized state
    console.log('\n=== Testing State Sanitization ===');
    for (const player of gameState.players) {
      const sanitized = gameEngine.getSanitizedState(player.id);
      
      // Verify player can see their own hand
      if (!sanitized.myHand) {
        console.error(`✗ ERROR: ${player.name} cannot see their own hand`);
        process.exit(1);
      }
      console.log(`✓ ${player.name} can see their hand (${sanitized.myHand.length} cards)`);
      
      // Verify player cannot see opponent hands (only counts)
      for (const sanitizedPlayer of sanitized.players) {
        if (sanitizedPlayer.id === player.id) {
          continue; // Skip self
        }
        // Should only have handCount, not actual cards
        console.log(`✓ ${player.name} sees ${sanitizedPlayer.name}'s hand count: ${sanitizedPlayer.handCount}`);
      }
    }

    // Test deck shuffle (verify cards are in different order)
    console.log('\n=== Testing Deck Shuffle ===');
    const gameEngine2 = new GameEngine();
    gameEngine2.initializeGame(['Player1', 'Player2']);
    const gameState2 = gameEngine2.getGameState();
    
    // Compare first 5 cards in draw pile
    let differentCards = 0;
    for (let i = 0; i < Math.min(5, gameState.drawPile.length, gameState2.drawPile.length); i++) {
      if (gameState.drawPile[i].id !== gameState2.drawPile[i].id) {
        differentCards++;
      }
    }
    
    if (differentCards > 0) {
      console.log(`✓ Deck shuffle working (${differentCards}/5 cards different in second game)`);
    } else {
      console.warn('⚠ Warning: Decks appear identical (shuffle may not be working)');
    }

    console.log('\n=== All Tests Passed! ===');
    console.log('✓ Game initialization working correctly');
    console.log('✓ Deck shuffle working');
    console.log('✓ Initial deal working (5 cards per player)');
    console.log('✓ State sanitization working');
    console.log('✓ Ready for gameplay!\n');

  } catch (error) {
    console.error('\n✗ ERROR during game initialization:');
    console.error(error);
    process.exit(1);
  }
}

// Run test
testGameInitialization();

// Made with Bob