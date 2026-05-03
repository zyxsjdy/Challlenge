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