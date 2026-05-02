# Project Plan: Monopoly Deal (LAN Multiplayer Edition)

## System Role
You are an expert game developer and software architect. We are building a networked, digital version of the card game "Monopoly Deal" designed for high-leverage, AI-assisted development. You will write clean, modular, well-documented code. We will build this iteratively, following the strict phased approach below.

## Project Overview
A multiplayer (2-5 players) turn-based digital card game replicating Monopoly Deal. The game operates on a local network (LAN) client-server model to enforce strict hidden-information rules. It requires a robust state management system, real-time bi-directional communication, and an interrupt-driven event loop.

## I. Technical Stack & Architecture
* **Architecture Pattern:** Authoritative Server with Thin Clients.
* **Backend Server:** Node.js with TypeScript and Socket.IO. Manages the central `GameState`, validates all moves, and handles real-time broadcasting.
* **Frontend Client:** Lightweight Web UI (HTML/CSS/TypeScript or React). Connects via WebSockets to the host's local IP. Requires zero installation for players across different OS ecosystems.
* **Shared Contracts:** A dedicated `shared/types.ts` folder containing the object-oriented blueprints (`Card`, `Player`, `GameState`). Both server and client consume these exact same types to prevent data desync.

## II. Game Rules & Mechanics

### 1. Game Objective
The first player to complete 3 full property sets of different colors on the table in front of them wins the game.

### 2. Game Setup
* **Deck Size:** 106 playable cards (Data parsed from provided dataset).
* **Players:** 2 to 5 players.
* **Initial Deal:** The deck is shuffled, and 5 cards are dealt to each player.
* **Draw Pile:** Remaining cards are placed face down in the center.

### 3. Turn Sequence
* **Start of Turn:** Active player draws 2 cards. *Edge Case:* If a player starts with 0 cards in hand, they draw 5 cards instead.
* **Play Phase:** The player may play up to 3 cards (0, 1, 2, or 3). Changing the color of a wild property is NOT counted into the 3-play limit.
* **End of Turn:** Maximum hand size is 7. Excess cards must be discarded into the center discard pile.

### 4. Play Areas
* **The Bank:** Money cards or Action cards (used purely as money) placed face up. Action cards banked lose their action ability permanently.
* **The Property Section:** Property cards and Wildcards organized by color.
* **The Discard Pile:** Action cards placed here when played for their effect.

### 5. Strict Constraints
* **No Take-Backs:** Once a card is placed, it cannot be returned to the hand.
* **Rearranging:** Players may rearrange properties/wildcards limitlessly, but *only* during their turn.
* **Look, Don't Touch (Enforced by Networking):** Clients only receive sanitized state updates. They cannot see opponents' hands or the draw pile sequence.
* **Empty Draw Pile:** If depleted, the discard pile is shuffled to form a new draw pile.

---

## III. Phased Implementation Plan

### Phase 1: Core Architecture & Data Contracts (COMPLETED)
The object-oriented structure has been defined in TypeScript. The `shared/types.ts` file contains the base `Card` class, its subclasses (`MoneyCard`, `PropertyCard`, `Wildcard`, `ActionCard`, `RentCard`), the `Player` state manager, and the central `GameState` environment.

### Phase 2: Data Pipeline & Server Initialization
* **Objective:** Ingest the raw 106-card dataset and initialize the server environment.
* **Tasks:**
  * Write a utility script on the Node.js backend to parse the card dataset.
  * Instantiate the correct TypeScript `Card` subclasses based on category and attributes.
  * Implement `GameState.initialize_deck()`, `shuffle_deck()`, and the initial 5-card distribution logic.

### Phase 3: The Core Game Loop (Server-Side Engine)
* **Objective:** Build the authoritative state machine without networking attached.
* **Tasks:**
  * Implement the `step(action)` method to process generic player actions.
  * Enforce turn constraints: Drawing 2 (or 5) cards, the 3-play limit, and the 7-card discard limit.
  * Implement the placement logic: routing cards to the Bank, Property lists, or Discard pile.
  * Implement the Win Condition listener (checking for 3 completed sets).

### Phase 4: Networking & Real-Time Sync
* **Objective:** Wrap the core engine in a Socket.IO communication layer.
* **Tasks:**
  * Establish the WebSocket connection protocol.
  * Define event payloads (e.g., `SERVER_STATE_BROADCAST`, `CLIENT_ACTION_REQUEST`).
  * Implement state sanitization: Ensure the server strips private hand data before broadcasting the `GameState` to individual clients.

### Phase 5: Action Card Logic & Interrupt Mechanics
* **Objective:** Implement the complex, multi-step constraints of specific game cards.
* **Tasks:**
  * **Targeting:** Implement an asynchronous pause state for cards requiring inputs (e.g., Sly Deal target selection).
  * **Payment Resolution:** Implement debt logic where targets must select cards from their Bank/Properties to satisfy a monetary value. Overpayment yields no change.
  * **The "Just Say No" Protocol:** Create the interrupt broadcast loop. When an action targets a player, the server must transition to an `AWAITING_REACTION` phase, polling the victim for a counter-play before executing the original action. Realize it like this: when a player is targeted by any action/rent card, a window will jump with title "Do you want to play Just Say No?", and two buttons: "I say NO!" and "Let it be". If this player does not have "Just Say No", they cannot click the "I say NO!" button.

### Phase 6: Client UI & Rendering
* **Objective:** Build the local player interface.
* **Tasks:**
  * Create a clean, responsive layout dividing the screen into: Opponent Tableaus, Center Piles, Local Tableaus, and Local Hand.
  * Implement visual drag-and-drop or click-to-play mechanics that emit Socket.IO events to the server.
  * Create modal prompts for targeting, paying rent, and reacting to interrupts.

#### Details & Edge Cases:

**1. Drag and Drop Processing (`on_card_drop`)**
When the user drags a card from their hand to the "Table Area", the backend must evaluate the card's Category and route it automatically:
* **Money Cards:** Automatically route to the `Player.bank`.
* **Property Cards:** Automatically route to `Player.properties` (grouping by color).
* **Dual-Use Cards (Action/Rent):** Pause execution and trigger a UI Prompt to the user: "Play as Action or Bank as Cash?"

**2. The Targeting System**
If a player plays a targeted Action or Rent card (e.g., Sly Deal, Force Deal, Debt Collector, Rent card, Deal Breaker), the game loop must pause and enter an `AWAITING_TARGET` state. The UI must prompt the user to select valid targets based on the card's `get_required_targets()` method.
* **Sly Deal:** User clicks a target opponent -> User clicks a valid property from that opponent's table -> Backend verifies it is not part of a completed set -> Execution continues.
* **Force Deal:** User clicks their own property -> User clicks opponent's property -> Backend verifies neither is a complete set -> Execution continues.
* **Rent Cards:** * *Validation:* The backend must first verify that the active player has at least one property on the table that matches the rent card's `valid_colors`.
  * *Targeting:* If standard, targets all opponents. If `is_wild` (10-color), user must click/select specific target opponent.
* **Double the Rent Flow:** When a user selects a Rent Card, the UI must prompt: *"Would you like to chain Double the Rent?"*. Playing a Rent card + Double the Rent counts as **two** plays toward the 3-card turn limit.
* **Payment Flow:** Backend calculates total rent owed. Game enters `AWAITING_PAYMENT`. Targeted opponent(s) receive pop-up showing amount. Opponent clicks preferred payment combination (Bank/Properties). Backend processes transfer (no change given).

**3. House & Hotel Constraints**
The backend must strictly enforce the following property upgrades:
* A House can *only* be placed on a completed property set.
* A Hotel can *only* be placed on a property set that already has a House.
* At most 1 House and 1 Hotel can be put on one complete property set.
* Houses and Hotels cannot be placed on Railroads or Utility sets.

**4. The Reaction/Interrupt System (Just Say No)**
The game must handle asynchronous interrupts. Whenever Player A plays an action negatively affecting Player B, the game state changes to `AWAITING_REACTION`.
* UI sends prompt to Player B (as defined in Phase 5).
* If declined/unavailable, original action resolves.
* If accepted, original action is negated.
* *Crucial Edge Case:* If Player B plays "Just Say No", state flips back to Player A to ask: "Player B played Just Say No. Do you want to play a Just Say No to counter?".

**5. Wild Property Manipulation (`handle_wildcard_swap`)**
The game must allow players to adjust their wildcards on the table limitlessly during their active turn.
* **Active Turn Constraint:** Backend must reject wildcard manipulation requests if it is not the user's active turn.
* **Dual-Color Wildcards:** UI features a "Swap Color" button. Backend automatically reorganizes `Player.properties`.
* **10-Color Wildcards:** UI allows drag and drop to attach it to different existing property sets.
* **Official Wildcard Rule:** Wildcards (including the 10-color wildcard) can be moved around the table as much as the player wants during their turn, even if it breaks up a previously completed set. No locking occurs.
