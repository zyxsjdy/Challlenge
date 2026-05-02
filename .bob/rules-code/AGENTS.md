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

## Mode Restrictions
- **Cannot edit**: Files outside of server/, client/, shared/ directories
- **No access to**: MCP tools, Browser tools