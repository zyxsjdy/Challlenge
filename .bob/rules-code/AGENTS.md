# Project Coding Rules (Non-Obvious Only)

## Critical Implementation Details

### Card Data Parsing
- [`carddata.csv`](../../carddata.csv:1) has 106 cards (rows 1-106), but file contains 996 lines - parser MUST stop at row 106
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
- Dual-color wildcards: automatic reorganization in [`Player.properties`](../../shared/src/types.ts:1)
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
- Turn play count incremented in [`GameEngine.playCard()`](../../server/src/game/GameEngine.ts:327) AFTER card routing completes
- Win condition checked in [`TurnManager.endTurn()`](../../server/src/game/TurnManager.ts:52) BEFORE advancing to next player
- [`WinCondition.countUniqueCompletedSets()`](../../server/src/game/WinCondition.ts:31) filters out houses/hotels (only counts properties/wildcards)
- AWAITING_DISCARD phase triggers when hand > 7 at turn end - must discard before turn advances
- Empty hand draw (5 cards) vs normal draw (2 cards) determined in [`TurnManager.startTurn()`](../../server/src/game/TurnManager.ts:15)

### Networking Architecture (Phase 4)
- [`StateSanitizer.sanitizeForPlayer()`](../../server/src/network/StateSanitizer.ts:19) creates player-specific views - opponent hands hidden, only counts visible
- `myHand` field in sanitized state is ONLY for requesting player (not in player objects array)
- [`SocketManager`](../../server/src/network/SocketManager.ts:29) handles ALL Socket.IO events - server/src/index.ts only initializes it
- State broadcasting is automatic after actions - GameEngine does NOT call broadcast methods
- Reconnection logic: 30-second timeout in [`SocketManager`](../../server/src/network/SocketManager.ts:34) before removing disconnected players
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
- [`SocketService`](../../client/src/services/socketService.ts:21) is a singleton - do NOT instantiate multiple times
- [`GameContext`](../../client/src/contexts/GameContext.tsx:1) is single source of truth - all components use `useGame()` hook
- Drag data MUST include both `cardId` and `cardCategory` for drop zone validation to work
- Modal state managed in GameContext, triggered by server events (not component local state)
- Server URL hardcoded in [`App.tsx`](../../client/src/App.tsx:1) - must change for production
- Drop zones validate card category before accepting drops (bank vs property areas)

## Mode Restrictions
- **Cannot edit**: Files outside of server/, client/, shared/ directories
- **No access to**: MCP tools, Browser tools