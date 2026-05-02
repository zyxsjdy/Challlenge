# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview
Monopoly Deal LAN multiplayer card game - Node.js/TypeScript backend with Socket.IO, lightweight web client.

## Architecture
- **Authoritative Server Pattern**: Server manages central GameState, validates all moves, broadcasts updates
- **Shared Contracts**: `shared/types.ts` contains OOP blueprints (Card, Player, GameState) consumed by both server and client
- **Hidden Information Enforcement**: Clients receive sanitized state updates only (no opponent hands or draw pile visibility)

## Critical Game Rules (Non-Obvious)
- **10-Color Wildcard**: Has NO monetary value (cannot be used for debt payment) despite being a property card
- **Wildcard Mobility**: Wildcards can be moved freely during active turn, even if it breaks a completed set (no locking)
- **Just Say No Chain**: When countered, original player gets chance to counter-counter (creates async interrupt loop)
- **House/Hotel Restrictions**: Only on completed sets, no Railroads/Utilities, max 1 House + 1 Hotel per set
- **Rent Card Validation**: Backend must verify player has matching property BEFORE allowing rent card play
- **Double the Rent**: Counts as separate play toward 3-card limit (Rent + Double = 2 plays)
- **Payment Flow**: No change given for overpayment; properties used as payment transfer to opponent's property section
- **Empty Hand Edge Case**: Player starting turn with 0 cards draws 5 instead of 2

## Data Structure
- 106 cards defined in `carddata.csv` with categories: Action, Property, Property Wildcard, Rent, Money
- Card routing: Money → Bank, Property → Properties (grouped by color), Action/Rent → Discard after use
- Dual-use cards (Action with monetary value) require UI prompt: "Play as Action or Bank as Cash?"

## State Machine
- Game states: PLAYING, AWAITING_TARGET, AWAITING_PAYMENT, AWAITING_REACTION
- Turn constraints: Draw 2 (or 5), play up to 3 cards, discard to 7 max hand size
- Win condition: First player with 3 complete property sets of different colors

## Implementation Phases
Phase 1 (COMPLETED): Core architecture & data contracts in TypeScript
Phase 2: Data pipeline & server initialization
Phase 3: Core game loop (server-side engine)
Phase 4: Networking & real-time sync
Phase 5: Action card logic & interrupt mechanics
Phase 6: Client UI & rendering