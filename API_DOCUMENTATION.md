# Monopoly Deal - API Documentation

## Table of Contents
1. [Core Classes](#core-classes)
2. [Game Engine](#game-engine)
3. [Action Handlers](#action-handlers)
4. [Network Layer](#network-layer)
5. [Shared Types](#shared-types)

---

## Core Classes

### GameState

**Location**: `shared/src/types.ts`

The central game state container that holds all game information.

#### Properties

```typescript
class GameState {
  players: Player[];              // All players in the game (2-5)
  drawPile: Card[];               // Cards available to draw
  discardPile: Card[];            // Cards that have been discarded
  currentPlayerId: string;        // ID of player whose turn it is
  turnPlayCount: number;          // Number of cards played this turn (max 3)
  phase: GamePhase;               // Current game phase
  pendingAction: PendingAction | null;  // Action awaiting response
}
```

#### Methods

**`initializeDeck(cards: Card[]): void`**
- Initializes the draw pile with provided cards
- Called during game setup with cards from CardFactory

**`shuffleDeck(): void`**
- Shuffles the draw pile using Fisher-Yates algorithm
- Called after initialization and when reshuffling discard pile

**`dealInitialHands(): void`**
- Deals 5 cards to each player at game start
- Removes dealt cards from draw pile

**`drawCards(playerId: string, count: number): Card[]`**
- Draws specified number of cards for a player
- Automatically reshuffles discard pile if draw pile is empty
- Returns empty array if both piles are empty

**`nextTurn(): void`**
- Advances to next player's turn
- Resets turn play count to 0
- Handles empty hand draw (5 cards instead of 2)

**`checkWinCondition(): string | null`**
- Checks if any player has 3 completed sets
- Returns winner's player ID or null

---

### Player

**Location**: `shared/src/types.ts`

Represents a player's state including cards and properties.

#### Properties

```typescript
class Player {
  id: string;                     // Unique player identifier
  name: string;                   // Player display name
  hand: Card[];                   // Cards in hand (hidden from opponents)
  bank: Card[];                   // Money and action cards banked
  properties: Map<PropertyColor, Card[]>;  // Properties grouped by color
  completedSets: Set<PropertyColor>;       // Colors with complete sets
}
```

#### Methods

**`addToHand(card: Card): void`**
- Adds a card to player's hand
- Used when drawing cards or receiving cards from opponents

**`playToBank(card: Card): void`**
- Moves a card from hand to bank
- Used for money cards and action cards played as cash

**`playToProperties(card: Card, color: PropertyColor): void`**
- Moves a property or wildcard to property area
- Automatically groups by color
- Updates completed sets tracking

**`calculateTotalMoney(): number`**
- Sums monetary value of all cards in bank
- Used for payment calculations and game statistics

**`hasCompletedSet(color: PropertyColor): boolean`**
- Checks if player has completed a specific color set
- Used for steal action validation

**`countCompletedSets(): number`**
- Returns total number of completed sets
- Used for win condition checking

**`updateCompletedSets(): void`**
- Recalculates which property sets are complete
- Called after property changes

---

### Card (Abstract Base Class)

**Location**: `shared/src/types.ts`

Base class for all card types in the game.

#### Properties

```typescript
abstract class Card {
  id: string;                     // Unique card identifier
  category: CardCategory;         // MONEY, PROPERTY, ACTION, RENT, etc.
  name: string;                   // Display name
  monetaryValue: number;          // Cash value (0 for non-monetary cards)
}
```

#### Methods

**`abstract canBeUsedForPayment(): boolean`**
- Determines if card can be used to pay debts
- Overridden by each card type
- 10-Color Wildcard returns false (value is 0)

---

## Game Engine

### GameEngine

**Location**: `server/src/game/GameEngine.ts`

Core game logic orchestrator that processes all player actions.

#### Constructor

```typescript
constructor()
```
- Initializes empty game state
- Creates TurnManager and WinCondition instances
- Initializes all action handlers

#### Public Methods

**`initializeGame(playerNames: string[]): void`**
- Creates players from names
- Loads and shuffles deck from CSV
- Deals initial hands (5 cards each)
- Sets first player and PLAYING phase

**`getGameState(): GameState`**
- Returns current game state
- Used by SocketManager for state broadcasting

**`processAction(action: PlayerAction): ActionResult`**
- Main entry point for all player actions
- Validates action against current game state
- Routes to appropriate handler
- Returns success/failure result

**`playCard(playerId: string, cardId: string, placement?: any): void`**
- Handles card play from hand
- Routes based on card category:
  - MONEY → bank
  - PROPERTY → properties
  - ACTION → execute action
  - RENT → execute rent
- Increments turn play count (except Just Say No)

**`moveWildcard(playerId: string, cardId: string, newColor: PropertyColor): void`**
- Moves wildcard between property colors
- Only allowed during active player's turn
- Updates property groupings

**`respondToAction(playerId: string, accept: boolean, justSayNoCardId?: string): void`**
- Handles Just Say No reactions
- Flips initiator/target for counter-counter
- Resolves action if accepted

**`submitPayment(playerId: string, cardIds: string[]): void`**
- Processes debt payment with selected cards
- Validates payment amount
- Routes cards to recipient

**`selectTarget(playerId: string, targetPlayerId: string, propertyId?: string): void`**
- Handles target selection for action cards
- Validates target is valid opponent
- Continues action execution

**`discardCards(playerId: string, cardIds: string[]): void`**
- Handles excess card discard when hand > 7
- Moves cards to discard pile
- Advances to next player's turn

#### Private Methods

**`routeToBank(playerId: string, card: Card): void`**
- Moves card to player's bank
- Used for money and action cards

**`routeToProperties(playerId: string, card: Card, color: PropertyColor): void`**
- Moves property/wildcard to property area
- Assigns color for wildcards
- Updates completed sets

**`routeToDiscard(card: Card): void`**
- Moves card to discard pile
- Used after action/rent card execution

---

### TurnManager

**Location**: `server/src/game/TurnManager.ts`

Manages turn lifecycle and validation.

#### Methods

**`startTurn(gameState: GameState): void`**
- Draws cards at turn start
- 5 cards if hand empty, 2 otherwise
- Resets turn play count

**`endTurn(gameState: GameState): boolean`**
- Checks hand limit (7 cards)
- Transitions to AWAITING_DISCARD if needed
- Checks win condition
- Advances to next player if no discard needed
- Returns true if turn successfully ended

**`canPlayCard(gameState: GameState): boolean`**
- Checks if player can play more cards
- Returns false if 3 cards already played
- Just Say No doesn't count toward limit

**`discardCards(gameState: GameState, playerId: string, cardIds: string[]): void`**
- Removes specified cards from hand
- Moves to discard pile
- Advances to next player

---

### WinCondition

**Location**: `server/src/game/WinCondition.ts`

Handles win condition detection.

#### Methods

**`check(gameState: GameState): string | null`**
- Checks if any player has 3 completed sets
- Returns winner's player ID or null
- Sets game phase to GAME_OVER if winner found

**`countUniqueCompletedSets(player: Player): number`**
- Counts completed property sets
- Filters out houses/hotels (only counts properties/wildcards)
- Skips non-completable sets (WILD_10_COLOR)

**`getWinStatus(gameState: GameState): Map<string, number>`**
- Returns completed set count for each player
- Used for progress tracking

---

## Action Handlers

### ActionHandler (Abstract Base)

**Location**: `server/src/actions/ActionHandler.ts`

Base class for all action card handlers.

#### Abstract Methods

**`canExecute(playerId: string, params: any): boolean`**
- Validates if action can be executed
- Checks player ownership, target validity, etc.

**`requiresTarget(): boolean`**
- Returns true if action needs target selection
- Used to show target selection modal

**`execute(playerId: string, params: any): void`**
- Executes the action
- Modifies game state
- Sets up pending actions if needed

#### Protected Helper Methods

**`getPlayer(playerId: string): Player`**
- Retrieves player from game state
- Throws error if not found

**`getOpponents(playerId: string): Player[]`**
- Returns all players except specified player
- Used for multi-target actions

---

### RentHandler

**Location**: `server/src/actions/RentHandler.ts`

Handles rent card execution and collection.

#### Methods

**`execute(playerId: string, params: RentData): void`**
- Validates player owns matching property
- Calculates rent amount (includes house/hotel bonuses)
- Sets up payment requirement for each opponent
- Handles wild rent (single target) vs standard rent (all opponents)

**`calculateRentAmount(player: Player, color: PropertyColor): number`**
- Counts properties of specified color
- Gets base rent from property's rentValues array
- Adds house bonus (+$3M) if present
- Adds hotel bonus (+$4M) if present

---

### StealHandlers

**Location**: `server/src/actions/StealHandlers.ts`

Handles property theft actions.

#### SlyDealHandler

**`execute(playerId: string, params: { targetPlayerId: string, propertyId: string }): void`**
- Steals single property from opponent
- Validates property is NOT in completed set
- Transfers property to initiator's property area
- Maintains color grouping

#### ForceDealHandler

**`execute(playerId: string, params: { targetPlayerId: string, myPropertyId: string, theirPropertyId: string }): void`**
- Swaps properties between players
- Validates NEITHER property is in completed set
- Transfers both properties
- Updates completed sets for both players

#### DealBreakerHandler

**`execute(playerId: string, params: { targetPlayerId: string, color: PropertyColor }): void`**
- Steals entire completed set
- Includes houses/hotels if present
- Transfers all cards to initiator
- Updates completed sets

---

### PaymentHandler

**Location**: `server/src/actions/PaymentHandler.ts`

Handles debt payment resolution.

#### Methods

**`processPayment(fromPlayerId: string, toPlayerId: string, amount: number, cardIds: string[]): void`**
- Validates payment amount meets requirement
- Validates 10-Color Wildcard not used (value 0)
- Routes cards to recipient:
  - Money/Action → bank
  - Properties → property area (maintains color)
- No change given for overpayment

**`getPayableCards(player: Player): Card[]`**
- Returns all cards that can be used for payment
- Excludes 10-Color Wildcard
- Includes bank cards and properties

---

### ReactionHandler

**Location**: `server/src/actions/ReactionHandler.ts`

Handles Just Say No interrupt chains.

#### Methods

**`promptReaction(actionType: ActionType, initiatorId: string, targetId: string): void`**
- Sets up pending action with reaction opportunity
- Checks if target has Just Say No in hand
- Emits reaction prompt event

**`handleReaction(accept: boolean, justSayNoCardId?: string): void`**
- If accepted: resolves action
- If countered: flips initiator/target, prompts counter-counter
- Discards Just Say No card after use

**`resolveAction(): void`**
- Executes the original action after reaction chain ends
- Clears pending action
- Returns to PLAYING phase

---

## Network Layer

### SocketManager

**Location**: `server/src/network/SocketManager.ts`

Manages Socket.IO connections and event routing.

#### Constructor

```typescript
constructor(io: Server, gameEngine: GameEngine)
```
- Stores Socket.IO server instance
- Stores GameEngine reference
- Initializes player tracking maps

#### Public Methods

**`initialize(): void`**
- Sets up Socket.IO event listeners
- Handles connection, disconnection, and all game events

**`handleConnection(socket: Socket): void`**
- Called when new client connects
- Sets up socket event handlers
- Tracks socket ID

**`handleDisconnect(socket: Socket): void`**
- Called when client disconnects
- Starts 30-second reconnection timer
- Removes player if not reconnected

**`broadcastGameState(): void`**
- Sanitizes state for each player
- Emits game_state_update to all connected players
- Includes myHand field for each player's own cards

#### Event Handlers

**`handleJoinGame(socket: Socket, playerName: string): void`**
- Adds player to game
- Broadcasts player_joined event
- Sends initial game state

**`handlePlayCard(socket: Socket, payload: PlayCardPayload): void`**
- Validates player's turn
- Calls gameEngine.playCard()
- Broadcasts updated state

**`handleEndTurn(socket: Socket): void`**
- Validates player's turn
- Calls turnManager.endTurn()
- Broadcasts updated state

**`handleSelectTarget(socket: Socket, payload: SelectTargetPayload): void`**
- Validates pending action
- Calls gameEngine.selectTarget()
- Broadcasts updated state

**`handleSubmitPayment(socket: Socket, payload: SubmitPaymentPayload): void`**
- Validates pending payment
- Calls gameEngine.submitPayment()
- Broadcasts updated state

**`handleRespondToAction(socket: Socket, payload: RespondToActionPayload): void`**
- Validates pending reaction
- Calls gameEngine.respondToAction()
- Broadcasts updated state

---

### StateSanitizer

**Location**: `server/src/network/StateSanitizer.ts`

Sanitizes game state for client security.

#### Methods

**`sanitizeForPlayer(gameState: GameState, requestingPlayerId: string): SanitizedGameState`**
- Creates player-specific view of game state
- Hides opponent hand cards (shows count only)
- Hides draw pile sequence (shows count only)
- Shows only top discard card
- Includes requesting player's hand in myHand field

**`validateSanitization(sanitized: SanitizedGameState, original: GameState): boolean`**
- Development/testing validation
- Ensures no opponent hands leaked
- Ensures draw pile hidden

**`createPartialUpdate(changes: Partial<GameState>): any`**
- Creates optimized partial state updates
- Future enhancement for performance

---

## Shared Types

### Enums

**Location**: `shared/src/enums.ts`

#### GamePhase

```typescript
enum GamePhase {
  WAITING_FOR_PLAYERS,  // Lobby phase
  PLAYING,              // Normal gameplay
  AWAITING_TARGET,      // Action needs target selection
  AWAITING_PAYMENT,     // Debt payment required
  AWAITING_REACTION,    // Just Say No opportunity
  AWAITING_DISCARD,     // Hand > 7, must discard
  GAME_OVER             // Winner determined
}
```

#### CardCategory

```typescript
enum CardCategory {
  MONEY,              // Pure currency cards
  PROPERTY,           // Standard property cards
  PROPERTY_WILDCARD,  // Dual-color and 10-color wildcards
  ACTION,             // Action cards
  RENT                // Rent cards
}
```

#### PropertyColor

```typescript
enum PropertyColor {
  BROWN,
  LIGHT_BLUE,
  PINK,
  ORANGE,
  RED,
  YELLOW,
  GREEN,
  DARK_BLUE,
  RAILROAD,
  UTILITY,
  WILD_10_COLOR       // Special wildcard color
}
```

#### ActionType

```typescript
enum ActionType {
  PASS_GO,
  SLY_DEAL,
  FORCED_DEAL,
  DEAL_BREAKER,
  JUST_SAY_NO,
  DEBT_COLLECTOR,
  ITS_MY_BIRTHDAY,
  HOUSE,
  HOTEL,
  DOUBLE_THE_RENT
}
```

---

### Constants

**Location**: `shared/src/constants.ts`

#### GAME_CONSTANTS

```typescript
const GAME_CONSTANTS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 5,
  INITIAL_HAND_SIZE: 5,
  NORMAL_DRAW_COUNT: 2,
  EMPTY_HAND_DRAW_COUNT: 5,
  MAX_HAND_SIZE: 7,
  MAX_PLAYS_PER_TURN: 3,
  WIN_CONDITION_SETS: 3,
  
  PROPERTY_SET_SIZES: {
    BROWN: 2,
    LIGHT_BLUE: 3,
    PINK: 3,
    ORANGE: 3,
    RED: 3,
    YELLOW: 3,
    GREEN: 3,
    DARK_BLUE: 2,
    RAILROAD: 4,
    UTILITY: 2
  },
  
  RENT_VALUES: {
    BROWN: [1, 2],
    LIGHT_BLUE: [1, 2, 3],
    // ... etc
  },
  
  PROPERTY_VALUES: {
    BROWN: 1,
    LIGHT_BLUE: 1,
    // ... etc
  },
  
  HOUSE_RENT_BONUS: 3,
  HOTEL_RENT_BONUS: 4,
  
  ACTION_PAYMENT_AMOUNTS: {
    DEBT_COLLECTOR: 5,
    ITS_MY_BIRTHDAY: 2
  }
};
```

#### Helper Functions

**`canHaveBuildings(color: PropertyColor): boolean`**
- Returns true if color can have houses/hotels
- False for RAILROAD and UTILITY

**`calculateRent(color: PropertyColor, count: number, hasHouse: boolean, hasHotel: boolean): number`**
- Calculates rent for property set
- Includes house/hotel bonuses
- Returns 0 if count exceeds set size

**`isSetComplete(color: PropertyColor, count: number): boolean`**
- Checks if property count completes the set
- Uses PROPERTY_SET_SIZES

---

### Events

**Location**: `shared/src/events.ts`

#### Client → Server Events

```typescript
interface PlayCardPayload {
  cardId: string;
  placement?: {
    area: 'bank' | 'properties';
    color?: PropertyColor;
    targetPlayerId?: string;
  };
}

interface SelectTargetPayload {
  targetPlayerId: string;
  propertyId?: string;
}

interface SubmitPaymentPayload {
  cardIds: string[];
}

interface RespondToActionPayload {
  accept: boolean;
  justSayNoCardId?: string;
}
```

#### Server → Client Events

```typescript
interface GameStateUpdatePayload {
  gameState: SanitizedGameState;
  myHand: Card[];
}

interface ActionRequiresTargetPayload {
  actionType: ActionType;
  validTargets: string[];
  requiresProperty?: boolean;
}

interface PaymentRequiredPayload {
  amount: number;
  fromPlayerId: string;
  toPlayerId: string;
  reason: string;
}

interface ReactionPromptPayload {
  actionType: ActionType;
  initiatorId: string;
  canCounter: boolean;
}
```

---

## Usage Examples

### Starting a Game

```typescript
const gameEngine = new GameEngine();
gameEngine.initializeGame(['Alice', 'Bob', 'Charlie']);
const state = gameEngine.getGameState();
```

### Playing a Card

```typescript
const action: PlayerAction = {
  type: 'PLAY_CARD',
  playerId: 'player-1',
  cardId: 'card-123',
  data: {
    placement: {
      area: 'bank'
    }
  }
};

const result = gameEngine.processAction(action);
if (result.success) {
  console.log('Card played successfully');
}
```

### Handling Just Say No

```typescript
// Player uses Just Say No
gameEngine.respondToAction('player-2', false, 'just-say-no-card-id');

// Original player can counter-counter
gameEngine.respondToAction('player-1', false, 'another-just-say-no-id');

// Or accept the counter
gameEngine.respondToAction('player-1', true);
```

---

## Error Handling

All methods that can fail return `ActionResult` with:
- `success: boolean` - Whether action succeeded
- `message: string` - Human-readable result
- `error?: string` - Error message if failed

Example error handling:

```typescript
const result = gameEngine.processAction(action);
if (!result.success) {
  console.error('Action failed:', result.error);
  // Notify client via Socket.IO
  socket.emit('error', { message: result.error });
}
```

---

## Performance Considerations

### State Sanitization
- Called for every state broadcast
- O(n) where n = number of players
- Optimized by only copying necessary data

### Card Lookup
- Cards stored in arrays (O(n) lookup)
- Consider Map for O(1) lookup if performance issues

### Event Broadcasting
- Broadcasts to all connected sockets
- Consider room-based broadcasting for multiple games

---

*Made with Bob*