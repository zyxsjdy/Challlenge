# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build/Run Commands (Non-Obvious Only)
- **Monorepo structure**: Uses npm workspaces - run commands from root with `--workspace=` flag
- **Server dev**: `npm run dev:server` (uses ts-node, not tsc watch)
- **Client dev**: `npm run dev:client` (Vite on port 3000, not default 5173)
- **Build all**: `npm run build` (builds all workspaces)
- **No test framework configured yet** (Phase 1 only has types)

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