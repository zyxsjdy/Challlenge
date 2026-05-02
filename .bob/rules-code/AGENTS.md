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

## Mode Restrictions
- **Cannot edit**: Files outside of server/, client/, shared/ directories
- **No access to**: MCP tools, Browser tools