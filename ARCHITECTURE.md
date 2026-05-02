# Monopoly Deal - Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [State Machine](#state-machine)
5. [Network Protocol](#network-protocol)
6. [Class Hierarchy](#class-hierarchy)

---

## System Overview

Monopoly Deal is a real-time multiplayer card game built with a client-server architecture using Socket.IO for bidirectional communication.

### High-Level Architecture

```mermaid
graph TB
    subgraph Client["Client Layer (React + TypeScript)"]
        UI[UI Components]
        GameContext[Game Context]
        SocketService[Socket Service]
    end
    
    subgraph Network["Network Layer (Socket.IO)"]
        WebSocket[WebSocket Connection]
    end
    
    subgraph Server["Server Layer (Node.js + TypeScript)"]
        SocketManager[Socket Manager]
        GameEngine[Game Engine]
        ActionHandlers[Action Handlers]
    end
    
    subgraph Shared["Shared Layer (TypeScript)"]
        Types[Card Classes & Types]
        Enums[Game Enums]
        Constants[Game Constants]
        Events[Event Definitions]
    end
    
    UI --> GameContext
    GameContext --> SocketService
    SocketService <--> WebSocket
    WebSocket <--> SocketManager
    SocketManager --> GameEngine
    GameEngine --> ActionHandlers
    
    Client -.->|imports| Shared
    Server -.->|imports| Shared
    
    style Client fill:#e1f5ff
    style Server fill:#fff4e1
    style Shared fill:#e8f5e9
    style Network fill:#f3e5f5
```

---

## Component Architecture

### Server Components

```mermaid
graph TB
    subgraph Server["Server Architecture"]
        Index[index.ts<br/>Express + Socket.IO Setup]
        
        subgraph Network["Network Layer"]
            SocketMgr[SocketManager<br/>Event Routing]
            StateSanitizer[StateSanitizer<br/>Hide Opponent Data]
        end
        
        subgraph Game["Game Logic Layer"]
            GameEngine[GameEngine<br/>Core Game Loop]
            TurnMgr[TurnManager<br/>Turn Lifecycle]
            WinCondition[WinCondition<br/>Victory Detection]
            CardFactory[CardFactory<br/>Card Instantiation]
        end
        
        subgraph Actions["Action Handler Layer"]
            ActionHandler[ActionHandler<br/>Base Class]
            RentHandler[RentHandler]
            StealHandlers[StealHandlers<br/>Sly/Force/Deal Breaker]
            PaymentHandler[PaymentHandler]
            ReactionHandler[ReactionHandler<br/>Just Say No]
            SpecialHandlers[SpecialActionHandlers<br/>Pass Go/Birthday/etc]
        end
        
        subgraph Utils["Utility Layer"]
            CSVParser[csvParser<br/>Parse carddata.csv]
        end
        
        Index --> SocketMgr
        SocketMgr --> GameEngine
        SocketMgr --> StateSanitizer
        GameEngine --> TurnMgr
        GameEngine --> WinCondition
        GameEngine --> CardFactory
        GameEngine --> ActionHandler
        ActionHandler --> RentHandler
        ActionHandler --> StealHandlers
        ActionHandler --> PaymentHandler
        ActionHandler --> ReactionHandler
        ActionHandler --> SpecialHandlers
        CardFactory --> CSVParser
    end
    
    style Network fill:#bbdefb
    style Game fill:#c8e6c9
    style Actions fill:#fff9c4
    style Utils fill:#f8bbd0
```

### Client Components

```mermaid
graph TB
    subgraph Client["Client Architecture"]
        App[App.tsx<br/>Root Component]
        
        subgraph Context["Context Layer"]
            GameContext[GameContext<br/>Global State]
        end
        
        subgraph Services["Service Layer"]
            SocketService[SocketService<br/>Socket.IO Client]
        end
        
        subgraph Components["Component Layer"]
            GameBoard[GameBoard<br/>Main Layout]
            
            subgraph Display["Display Components"]
                OpponentView[OpponentView]
                CenterPiles[CenterPiles]
                TurnIndicator[TurnIndicator]
            end
            
            subgraph Player["Player Components"]
                PlayerHand[PlayerHand<br/>Draggable Cards]
                BankArea[BankArea<br/>Drop Zone]
                PropertyArea[PropertyArea<br/>Drop Zones]
            end
            
            subgraph Modals["Modal Components"]
                TargetModal[TargetModal]
                PaymentModal[PaymentModal]
                ReactionModal[ReactionModal]
                DualUseModal[DualUseModal]
            end
            
            CardComponent[CardComponent<br/>Reusable Card Renderer]
        end
        
        App --> GameContext
        GameContext --> SocketService
        GameContext --> GameBoard
        GameBoard --> Display
        GameBoard --> Player
        GameBoard --> Modals
        Player --> CardComponent
        Modals --> CardComponent
    end
    
    style Context fill:#e1bee7
    style Services fill:#b2dfdb
    style Display fill:#c5cae9
    style Player fill:#ffccbc
    style Modals fill:#f0f4c3
```

---

## Data Flow

### Game Action Flow

```mermaid
sequenceDiagram
    participant Player as Player Browser
    participant Client as React Client
    participant Socket as Socket.IO
    participant Server as Socket Manager
    participant Engine as Game Engine
    participant Handler as Action Handler
    
    Player->>Client: Drag card to drop zone
    Client->>Socket: emit('play_card', {cardId, placement})
    Socket->>Server: Forward event
    Server->>Engine: processAction(playerId, action)
    Engine->>Handler: execute(gameState, params)
    Handler->>Engine: Update game state
    Engine->>Server: Return updated state
    Server->>Server: Sanitize state per player
    Server->>Socket: broadcast('game_state_update')
    Socket->>Client: Receive sanitized state
    Client->>Player: Update UI
    
    Note over Server,Engine: If action requires response
    Server->>Socket: emit('action_requires_target')
    Socket->>Client: Show target modal
    Player->>Client: Select target
    Client->>Socket: emit('select_target', {targetId})
    Socket->>Server: Forward selection
    Server->>Engine: Continue action execution
```

### State Synchronization Flow

```mermaid
sequenceDiagram
    participant P1 as Player 1
    participant P2 as Player 2
    participant Server as Server
    participant Engine as Game Engine
    
    P1->>Server: play_card
    Server->>Engine: Process action
    Engine->>Engine: Update game state
    Engine->>Server: Return state
    
    par Sanitize for each player
        Server->>Server: Sanitize for P1<br/>(show P1 hand, hide P2 hand)
        Server->>Server: Sanitize for P2<br/>(show P2 hand, hide P1 hand)
    end
    
    par Broadcast to all
        Server->>P1: game_state_update<br/>(P1's view)
        Server->>P2: game_state_update<br/>(P2's view)
    end
    
    P1->>P1: Update UI with own hand
    P2->>P2: Update UI with own hand
```

---

## State Machine

### Game Phase Transitions

```mermaid
stateDiagram-v2
    [*] --> WAITING_FOR_PLAYERS: Server starts
    
    WAITING_FOR_PLAYERS --> PLAYING: All players joined<br/>Game initialized
    
    PLAYING --> AWAITING_TARGET: Action card requires target
    AWAITING_TARGET --> AWAITING_REACTION: Target selected
    AWAITING_TARGET --> PLAYING: Target selected (no reaction)
    
    PLAYING --> AWAITING_PAYMENT: Rent/Debt action
    AWAITING_PAYMENT --> AWAITING_REACTION: Payment required
    AWAITING_PAYMENT --> PLAYING: Payment submitted
    
    PLAYING --> AWAITING_REACTION: Action can be countered
    AWAITING_REACTION --> AWAITING_REACTION: Just Say No used<br/>(counter-counter)
    AWAITING_REACTION --> AWAITING_PAYMENT: Action accepted<br/>Payment required
    AWAITING_REACTION --> PLAYING: Action accepted<br/>No payment
    
    PLAYING --> AWAITING_DISCARD: Turn ended<br/>Hand > 7 cards
    AWAITING_DISCARD --> PLAYING: Cards discarded<br/>Next player's turn
    
    PLAYING --> GAME_OVER: Win condition met<br/>(3 complete sets)
    
    GAME_OVER --> [*]
    
    note right of PLAYING
        Main game phase
        - Draw cards
        - Play up to 3 cards
        - End turn
    end note
    
    note right of AWAITING_REACTION
        Just Say No chain
        - Original target can counter
        - Initiator can counter-counter
        - Continues until accepted
    end note
```

### Turn Lifecycle

```mermaid
stateDiagram-v2
    [*] --> TurnStart: Player's turn begins
    
    TurnStart --> DrawCards: Auto-draw phase
    DrawCards --> PlayPhase: Cards drawn
    
    state PlayPhase {
        [*] --> CanPlay: Play count < 3
        CanPlay --> CardPlayed: Play card
        CardPlayed --> CanPlay: Play count < 3
        CardPlayed --> MaxPlays: Play count = 3
        MaxPlays --> [*]
    }
    
    PlayPhase --> EndTurn: Player ends turn
    
    EndTurn --> CheckHand: Check hand size
    
    state CheckHand <<choice>>
    CheckHand --> DiscardPhase: Hand > 7
    CheckHand --> CheckWin: Hand ≤ 7
    
    DiscardPhase --> CheckWin: Discarded to 7
    
    state CheckWin <<choice>>
    CheckWin --> GameOver: 3 complete sets
    CheckWin --> NextPlayer: < 3 complete sets
    
    NextPlayer --> [*]: Next player's turn
    GameOver --> [*]: Game ends
```

---

## Network Protocol

### Socket.IO Events

```mermaid
graph LR
    subgraph Client to Server
        C1[join_game]
        C2[play_card]
        C3[end_turn]
        C4[select_target]
        C5[submit_payment]
        C6[respond_to_action]
        C7[move_wildcard]
        C8[discard_cards]
    end
    
    subgraph Server to Client
        S1[game_state_update]
        S2[player_joined]
        S3[turn_started]
        S4[card_played]
        S5[action_requires_target]
        S6[payment_required]
        S7[reaction_prompt]
        S8[game_over]
        S9[error]
    end
    
    C1 -.->|Player connects| S2
    C2 -.->|Card played| S4
    C2 -.->|State changed| S1
    C2 -.->|Needs target| S5
    C2 -.->|Needs payment| S6
    C2 -.->|Can be countered| S7
    C3 -.->|Turn ended| S3
    C4 -.->|Target selected| S1
    C5 -.->|Payment submitted| S1
    C6 -.->|Reaction given| S1
    
    style Client to Server fill:#e3f2fd
    style Server to Client fill:#fff3e0
```

### Event Payload Structure

```typescript
// Client → Server Events
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
  propertyId?: string;  // For Force Deal
}

interface SubmitPaymentPayload {
  cardIds: string[];
}

interface RespondToActionPayload {
  accept: boolean;  // false = use Just Say No
  justSayNoCardId?: string;
}

// Server → Client Events
interface GameStateUpdatePayload {
  gameState: SanitizedGameState;
  myHand: Card[];  // Only for requesting player
}

interface ActionRequiresTargetPayload {
  actionType: ActionType;
  validTargets: string[];  // Player IDs
  requiresProperty?: boolean;  // For Force Deal
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
  canCounter: boolean;  // Has Just Say No in hand
}
```

---

## Class Hierarchy

### Card Class Hierarchy

```mermaid
classDiagram
    class Card {
        <<abstract>>
        +string id
        +CardCategory category
        +string name
        +number monetaryValue
        +canBeUsedForPayment() boolean
    }
    
    class MoneyCard {
        +canBeUsedForPayment() boolean
    }
    
    class PropertyCard {
        +PropertyColor color
        +number fullSetSize
        +number[] rentValues
        +getRentValue(count: number) number
        +canBeUsedForPayment() boolean
    }
    
    class PropertyWildcard {
        +PropertyColor[] validColors
        +PropertyColor currentColor
        +assignToColor(color: PropertyColor) void
        +canBeUsedForPayment() boolean
    }
    
    class ActionCard {
        +ActionType actionType
        +string description
        +boolean requiresTarget
        +canBeUsedForPayment() boolean
    }
    
    class RentCard {
        +PropertyColor[] validColors
        +boolean isWild
        +canBeUsedForPayment() boolean
    }
    
    Card <|-- MoneyCard
    Card <|-- PropertyCard
    Card <|-- PropertyWildcard
    Card <|-- ActionCard
    Card <|-- RentCard
    
    note for PropertyWildcard "10-Color wildcard has\nmonetaryValue = 0\ncanBeUsedForPayment() = false"
```

### Game State Classes

```mermaid
classDiagram
    class GameState {
        +Player[] players
        +Card[] drawPile
        +Card[] discardPile
        +string currentPlayerId
        +number turnPlayCount
        +GamePhase phase
        +PendingAction pendingAction
        +initializeDeck() void
        +shuffleDeck() void
        +dealInitialHands() void
        +drawCards(playerId: string, count: number) Card[]
        +nextTurn() void
        +checkWinCondition() string | null
    }
    
    class Player {
        +string id
        +string name
        +Card[] hand
        +Card[] bank
        +Map~PropertyColor, Card[]~ properties
        +Set~PropertyColor~ completedSets
        +addToHand(card: Card) void
        +playToBank(card: Card) void
        +playToProperties(card: Card, color: PropertyColor) void
        +calculateTotalMoney() number
        +hasCompletedSet(color: PropertyColor) boolean
        +countCompletedSets() number
    }
    
    class PendingAction {
        +ActionType type
        +string initiatorId
        +string targetId
        +any data
        +boolean canBeCountered
        +string[] remainingTargets
    }
    
    GameState "1" *-- "2..5" Player
    GameState "1" *-- "0..1" PendingAction
    GameState "1" *-- "*" Card
```

### Action Handler Hierarchy

```mermaid
classDiagram
    class ActionHandler {
        <<abstract>>
        #GameState gameState
        +canExecute(playerId: string, params: any) boolean
        +requiresTarget() boolean
        +execute(playerId: string, params: any) void
        #getPlayer(playerId: string) Player
        #getOpponents(playerId: string) Player[]
    }
    
    class RentHandler {
        +canExecute(playerId: string, params: any) boolean
        +requiresTarget() boolean
        +execute(playerId: string, params: any) void
        -calculateRentAmount(player: Player, color: PropertyColor) number
    }
    
    class SlyDealHandler {
        +canExecute(playerId: string, params: any) boolean
        +requiresTarget() boolean
        +execute(playerId: string, params: any) void
    }
    
    class ForceDealHandler {
        +canExecute(playerId: string, params: any) boolean
        +requiresTarget() boolean
        +execute(playerId: string, params: any) void
    }
    
    class DealBreakerHandler {
        +canExecute(playerId: string, params: any) boolean
        +requiresTarget() boolean
        +execute(playerId: string, params: any) void
    }
    
    class PaymentHandler {
        +processPayment(fromId: string, toId: string, amount: number, cardIds: string[]) void
        -routeCardToRecipient(card: Card, recipient: Player) void
    }
    
    class ReactionHandler {
        +promptReaction(actionType: ActionType, initiatorId: string, targetId: string) void
        +handleReaction(accept: boolean, justSayNoCardId?: string) void
        -resolveAction() void
    }
    
    ActionHandler <|-- RentHandler
    ActionHandler <|-- SlyDealHandler
    ActionHandler <|-- ForceDealHandler
    ActionHandler <|-- DealBreakerHandler
    ActionHandler <|-- PaymentHandler
    ActionHandler <|-- ReactionHandler
```

---

## Key Design Patterns

### 1. Authoritative Server Pattern
- **Server**: Single source of truth for game state
- **Client**: Thin UI layer that displays server state
- **Validation**: All game logic validated server-side
- **Security**: Opponent hands hidden via state sanitization

### 2. Event-Driven Architecture
- **Socket.IO**: Bidirectional event communication
- **Decoupling**: Components communicate via events
- **Real-time**: Instant state synchronization across clients

### 3. Strategy Pattern (Action Handlers)
- **Base Class**: `ActionHandler` defines interface
- **Concrete Handlers**: Each action type has dedicated handler
- **Polymorphism**: GameEngine routes to appropriate handler

### 4. State Machine Pattern
- **Phases**: Explicit game phases (PLAYING, AWAITING_TARGET, etc.)
- **Transitions**: Controlled state transitions
- **Validation**: Actions validated against current phase

### 5. Observer Pattern (React Context)
- **Context**: Global game state observable
- **Components**: Subscribe to state changes
- **Updates**: Automatic re-rendering on state changes

---

## Performance Considerations

### Server Optimizations
1. **State Sanitization**: Only send necessary data to each client
2. **Event Batching**: Group related state updates
3. **Memory Management**: Proper cleanup of disconnected players
4. **Card Pooling**: Reuse card objects from discard pile

### Client Optimizations
1. **React Memoization**: Prevent unnecessary re-renders
2. **Lazy Loading**: Load modals only when needed
3. **Virtual Scrolling**: For large card collections (future)
4. **Debouncing**: Prevent rapid-fire actions

### Network Optimizations
1. **Compression**: Socket.IO compression enabled
2. **Delta Updates**: Send only changed state (future enhancement)
3. **Reconnection**: Automatic reconnection with exponential backoff
4. **Heartbeat**: Keep-alive to detect disconnections

---

## Security Considerations

### Server-Side Validation
- All actions validated before execution
- Player identity verified via socket ID
- Turn ownership checked before allowing plays
- Card ownership verified before moves

### State Sanitization
- Opponent hands completely hidden
- Draw pile sequence hidden
- Only top discard card visible
- Pending actions sanitized per player perspective

### Network Security
- CORS configured for development/production
- Socket.IO authentication (future enhancement)
- Rate limiting on actions (future enhancement)
- Input validation on all payloads

---

## Scalability Considerations

### Current Architecture (Single Server)
- Supports 2-5 players per game
- Single game instance per server
- Suitable for LAN play

### Future Enhancements
- **Multiple Games**: Support multiple concurrent games
- **Game Rooms**: Room-based game management
- **Persistence**: Save/load game state
- **Spectator Mode**: Watch games without playing
- **Replay System**: Record and replay games

---

*Made with Bob*