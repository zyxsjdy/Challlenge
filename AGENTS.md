# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build/Run Commands (Non-Obvious Only)
- **Monorepo structure**: Uses npm workspaces - run commands from root with `--workspace=` flag
- **Server dev**: `npm run dev:server` (uses ts-node, not tsc watch)
- **Client dev**: `npm run dev:client` (Vite on port 3000, not default 5173)
- **Build all**: `npm run build` (builds all workspaces)
- **Test scripts**: Run with `npx ts-node` from server directory (e.g., `npx ts-node src/test-deck.ts`)

## Code Style (Non-Obvious Only)
- **No ESLint/Prettier configs** - relies on TypeScript strict mode only
- **TypeScript path aliases**: Import from `shared/*` maps to `../shared/src/*` in both server and client
- **Shared package**: Uses CommonJS (`module: "commonjs"`) while client uses ESNext
- **File comments**: All generated files end with `// Made with Bob`

## Project-Specific Patterns
- **CSV parsing**: [`carddata.csv`](carddata.csv:1) has 106 cards but 996 total lines - parser MUST stop at row 106
- **OOP architecture**: All card types extend abstract [`Card`](shared/src/types.ts:6) class in [`shared/types.ts`](shared/src/types.ts:1)
- **Enums over unions**: Uses TypeScript enums for [`GamePhase`](shared/src/enums.ts:4), [`CardCategory`](shared/src/enums.ts:16), [`PropertyColor`](shared/src/enums.ts:27), [`ActionType`](shared/src/enums.ts:44)
- **Constants file**: Game rules encoded in [`GAME_CONSTANTS`](shared/src/constants.ts:7) object (not hardcoded in logic)
- **Socket.IO player IDs**: Server uses socket.id as player ID (not separate UUID generation)
- **CardFactory path**: Default CSV path is `'../carddata.csv'` relative to server/src/game/ directory
- **Turn play count**: Incremented in [`GameEngine.playCard()`](server/src/game/GameEngine.ts:327) after card routing, not before
- **Win condition check**: Called in [`TurnManager.endTurn()`](server/src/game/TurnManager.ts:52) BEFORE advancing to next player
- **Property counting**: [`WinCondition`](server/src/game/WinCondition.ts:43) filters out houses/hotels when counting set completion
- **AWAITING_DISCARD phase**: Added in Phase 3 - triggers when hand exceeds 7 cards at turn end

## Networking Architecture (Phase 4)
- **State sanitization**: [`StateSanitizer`](server/src/network/StateSanitizer.ts:19) hides opponent hands, draw pile sequence, and full discard pile
- **myHand field**: Sanitized state includes `myHand` field ONLY for requesting player (not in player objects)
- **Reconnection window**: 30-second timeout before removing disconnected players (in [`SocketManager`](server/src/network/SocketManager.ts:34))
- **Event routing**: All Socket.IO logic delegated to [`SocketManager`](server/src/network/SocketManager.ts:29), not in server/src/index.ts
- **State broadcasting**: Automatic after every action - no manual broadcast calls needed in GameEngine

## Action Card System (Phase 5)
- **Just Say No**: Cannot be played directly, only as reaction; does NOT count toward 3-card play limit
- **Payment routing**: Properties used as payment go to recipient's property area (not bank) via `addCardToRecipient()`
- **10-Color Wildcard**: `canBeUsedForPayment()` returns false (value is 0)
- **Reaction chains**: Flip initiator/target roles for counter-counter mechanics
- **Multi-target actions**: Birthday uses `remainingTargets` array in pendingAction for sequential processing
- **House/Hotel tracking**: Uses `(card as any).hasHouse` - not formalized in PropertyCard type yet
- **Wild rent targeting**: Requires `targetPlayerId` in placement data (targets ONE opponent, not all)