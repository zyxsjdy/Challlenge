# Project Coding Rules (Non-Obvious Only)

## Critical Implementation Details

### Card Data Parsing
- "10-Color Multi-Color" wildcard has value "0" (not "$0M") - special case in parsing logic
- Rent Value column format: "1,2,3" (comma-separated) for progressive rent based on set completion

### State Machine Constraints
- Just Say No does NOT count toward 3-card play limit (special interrupt mechanic)
- Changing wildcard color does NOT count toward 3-card play limit
- "Double the Rent" DOES count as a play (Rent + Double = 2 plays toward limit)

### Payment Resolution Edge Cases
- 10-Color Wildcard cannot be used for debt payment (value is 0, not monetary)
- Properties used as payment go to opponent's property section, not their bank
- No change given for overpayment - excess value is lost

### Wildcard Manipulation Rules
- Wildcards can break completed sets during active turn (no locking mechanism)
- Backend must reject wildcard moves if not player's active turn
- Dual-color wildcards: automatic reorganization in `Player.properties`
- 10-color wildcards: drag-and-drop to attach to different property sets

### House/Hotel Validation
- Cannot place on Railroad or Utility sets (must validate property type)
- Must check for existing House before allowing Hotel placement
- Max 1 House + 1 Hotel per completed set (not per property)

### Rent Card Special Logic
- Backend MUST verify player owns matching property before allowing rent card play
- Standard rent cards target ALL opponents automatically
- 10-color wild rent targets ONE specific opponent (requires targeting UI)

### Turn Management Implementation (Phase 3)
- Turn play count incremented in `GameEngine.playCard()` AFTER card routing completes
- Win condition checked in `TurnManager.endTurn()` BEFORE advancing to next player
- `WinCondition.countUniqueCompletedSets()` filters out houses/hotels (only counts properties/wildcards)
- AWAITING_DISCARD phase triggers when hand > 7 at turn end - must discard before turn advances
- Empty hand draw (5 cards) vs normal draw (2 cards) determined in `TurnManager.startTurn()`

### Networking Architecture (Phase 4)
- `StateSanitizer.sanitizeForPlayer()` creates player-specific views - opponent hands hidden, only counts visible
- `myHand` field in sanitized state is ONLY for requesting player (not in player objects array)
- `SocketManager` handles ALL Socket.IO events - server/src/index.ts only initializes it
- State broadcasting is automatic after actions - GameEngine does NOT call broadcast methods
- Reconnection logic: 30-second timeout in `SocketManager` before removing disconnected players
- Draw pile sequence hidden (count only), discard pile shows top card only

### Action Card System (Phase 5)
- Just Say No CANNOT be played directly - only as reaction (GameEngine blocks direct play)
- Just Say No does NOT increment `turnPlayCount` (special interrupt mechanic)
- Payment handler uses `card.canBeUsedForPayment()` - 10-Color Wildcard returns false (value 0)
- Properties used as payment route to recipient's property area via `addCardToRecipient()`, NOT bank
- Multi-target actions (Birthday) use `remainingTargets` array in pendingAction for sequential processing
- Reaction chain flips initiator/target roles - original initiator becomes target for counter-counter
- House/Hotel tracking uses `(card as any).hasHouse` - not formalized in PropertyCard type yet
- Action handlers extend abstract `ActionHandler` base class with `canExecute()`, `requiresTarget()`, `execute()`
- Rent calculation includes House (+$3M) and Hotel (+$4M) bonuses via `calculateRent()` helper
- Wild rent cards require `targetPlayerId` in placement data (targets ONE opponent, not all)

### Client UI Architecture (Phase 6)
- `SocketService` is a singleton - do NOT instantiate multiple times
- `GameContext` is single source of truth - all components use `useGame()` hook
- Drag data MUST include both `cardId` and `cardCategory` for drop zone validation to work
- Modal state managed in GameContext, triggered by server events (not component local state)
- Server URL hardcoded in `App.tsx` to port 3001 - change for production deployment
- Drop zones validate card category before accepting drops (bank vs property areas)

### Phase 7 Bug Fix (Critical)
- **Duplicate discard bug**: Action/Rent handlers are solely responsible for discarding cards - GameEngine must NOT call `routeToDiscard()` after handler execution (was causing duplicate card references in discard pile)

## Agent Rules Standard (AGENTS.md):
# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build/Run Commands (Non-Obvious Only)
- **Test scripts**: Run with `npx ts-node` from server directory (e.g., `npx ts-node src/test-deck.ts`)
- **Client dev**: Vite on port 3000, server on port 3001
- **Vite import resolution**: Shared package requires explicit aliases in vite.config.ts for each module file (enums, types, events, constants) - generic alias doesn't work

## Code Style (Non-Obvious Only)
- **No ESLint/Prettier configs** - relies on TypeScript strict mode only
- **Shared package**: Uses CommonJS (`module: "commonjs"`) while client uses ESNext
- **File comments**: All generated files end with `// Made with Bob`

## Project-Specific Patterns
- **CardFactory path**: Default CSV path is `'../carddata.csv'` relative to server/src/game/ directory
- **Turn play count**: Incremented in `GameEngine.playCard()` AFTER card routing completes, not before
- **Win condition check**: Called in `TurnManager.endTurn()` BEFORE advancing to next player
- **Property counting**: `WinCondition` filters out houses/hotels when counting set completion

## Networking Architecture
- **myHand field**: Sanitized state includes `myHand` field ONLY for requesting player (not in player objects array)
- **Event routing**: All Socket.IO logic delegated to `SocketManager`, not in server/src/index.ts
- **State broadcasting**: Automatic after every action - no manual broadcast calls needed in GameEngine

## Action Card System
- **Just Say No**: Cannot be played directly, only as reaction; does NOT count toward 3-card play limit
- **Payment routing**: Properties used as payment go to recipient's property area (not bank) via `addCardToRecipient()`
- **10-Color Wildcard**: `canBeUsedForPayment()` returns false (value is 0)
- **House/Hotel tracking**: Uses `(card as any).hasHouse` - not formalized in PropertyCard type yet
- **Wild rent targeting**: Requires `targetPlayerId` in placement data (targets ONE opponent, not all)

## Client UI Architecture
- **SocketService singleton**: Global instance in `client/src/services/socketService.ts` - do NOT create multiple instances
- **Drag data format**: Must include `cardId` and `cardCategory` for drop zone validation
- **Modal state**: Managed in GameContext, triggered by server events (not component local state)
- **Server URL**: Hardcoded in `App.tsx` to port 3001 - change for production deployment

## Critical Bug Fixes
- **Duplicate discard bug**: Action/Rent handlers are solely responsible for discarding cards - GameEngine must NOT call `routeToDiscard()` after handler execution (was causing duplicate card references in discard pile)


## Mode Restrictions
- **Cannot edit**: Files outside of server/, client/, shared/ directories
- **No access to**: MCP tools, Browser tools