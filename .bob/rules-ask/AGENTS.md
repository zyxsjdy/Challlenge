# Project Documentation Rules (Non-Obvious Only)

## Project Structure Context

### Documentation Organization
- [`Instruction.md`](../../Instruction.md:1) contains complete game rules and phased implementation plan (121 lines)
- [`carddata.csv`](../../carddata.csv:1) has 106 actual cards but 996 total lines (890 empty rows must be ignored)
- Phase 1 marked as COMPLETED - [`shared/types.ts`](../../shared/src/types.ts:1) with OOP structure exists

### Hidden Game Mechanics
- "Just Say No" creates recursive interrupt chain - Player B can counter, then Player A can counter-counter
- Dual-use Action cards require UI prompt before placement: "Play as Action or Bank as Cash?"
- Empty draw pile triggers shuffle of discard pile to form new draw pile

### Non-Obvious Constraints
- Maximum hand size is 7 cards - excess must be discarded at end of turn
- Players can only rearrange properties/wildcards during their own turn
- "No Take-Backs" rule: once card is placed, cannot return to hand

### State Machine Phases
- [`AWAITING_TARGET`](../../shared/src/enums.ts:7): Game pauses for user to select opponent/property for targeted actions
- [`AWAITING_PAYMENT`](../../shared/src/enums.ts:8): Game pauses for opponent to select payment cards (Bank/Properties)
- [`AWAITING_REACTION`](../../shared/src/enums.ts:9): Game pauses for "Just Say No" response from targeted player

### Card Value Edge Cases
- 10-Color Wildcard has value "0" in CSV (not "$0M" like other cards)
- Action cards banked as money lose their action ability permanently
- Rent Value column uses comma-separated format "1,2,3" for progressive rent tiers