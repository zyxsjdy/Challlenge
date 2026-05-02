# Project Architecture Rules (Non-Obvious Only)

## Architectural Constraints

### Authoritative Server Pattern
- Server holds single source of truth ([`GameState`](../../shared/src/types.ts:1)) - clients are thin display layers only
- All game logic validation happens server-side - clients cannot modify state directly
- State sanitization required: server strips opponent hands and draw pile before broadcasting

### Hidden Information Enforcement
- Clients receive different state views based on player perspective
- Draw pile sequence must remain hidden from all clients
- Opponent hands must be hidden (only card count visible)

### Interrupt-Driven Event Loop
- Game must pause execution for async user inputs (targeting, payment selection, reactions)
- State machine transitions: [`PLAYING`](../../shared/src/enums.ts:6) → [`AWAITING_TARGET`](../../shared/src/enums.ts:7) → [`AWAITING_PAYMENT`](../../shared/src/enums.ts:8) → [`AWAITING_REACTION`](../../shared/src/enums.ts:9)
- "Just Say No" creates nested interrupt loops (counter → counter-counter chain)

### Card Routing Architecture
- Money cards → [`Player.bank`](../../shared/src/types.ts:1) (permanent placement)
- Property cards → [`Player.properties`](../../shared/src/types.ts:1) (grouped by color, can be reorganized)
- Action/Rent cards → Discard pile after use (one-time effects)
- Dual-use cards require UI decision before routing

### Phase Dependencies (ALL COMPLETED)
- Phase 1 ✅: OOP contracts in [`shared/types.ts`](../../shared/src/types.ts:1)
- Phase 2 ✅: CSV parser that stops at row 106, CardFactory, GameEngine bootstrap
- Phase 3 ✅: Turn constraint enforcement (draw 2/5, play 3, discard to 7), win condition
- Phase 4 ✅: State sanitization logic per player, Socket.IO networking
- Phase 5 ✅: All 10 action card types, payment resolution, Just Say No chains
- Phase 6 ✅: React UI with drag-and-drop, modals, real-time state sync

### Non-Standard Game Flow
- Empty hand at turn start triggers draw 5 (not standard draw 2)
- Wildcard color changes don't count toward 3-card play limit
- Properties used as payment transfer to opponent's property section (not bank)
- No change mechanism for overpayment - excess value is forfeited