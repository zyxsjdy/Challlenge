# Monopoly Deal - Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the Game](#running-the-game)
4. [LAN Multiplayer Setup](#lan-multiplayer-setup)
5. [Troubleshooting](#troubleshooting)
6. [Game Rules Quick Reference](#game-rules-quick-reference)

---

## Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository

### System Requirements
- **OS**: macOS, Windows, or Linux
- **RAM**: 2GB minimum
- **Display**: 1920x1080 recommended (minimum 1280x720)
- **Network**: Local network for multiplayer (LAN)

### Check Your Installation
```bash
node --version   # Should show v18.0.0 or higher
npm --version    # Should show 8.0.0 or higher
```

---

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Challlenge
```

### 2. Install Dependencies
The project uses npm workspaces. Install all dependencies with a single command:

```bash
npm install
```

This will install dependencies for:
- Root workspace
- `shared/` package (TypeScript types and constants)
- `server/` package (Node.js backend)
- `client/` package (React frontend)

### 3. Build Shared Package
The shared package must be compiled before running server or client:

```bash
npm run build --workspace=shared
```

---

## Running the Game

### Development Mode (Recommended)

#### Option 1: Run Both Server and Client Together
```bash
# From project root
npm run dev
```

This starts:
- Server on `http://localhost:3001`
- Client on `http://localhost:3000`

#### Option 2: Run Server and Client Separately

**Terminal 1 - Start Server:**
```bash
npm run dev:server
```
Server will start on port 3001.

**Terminal 2 - Start Client:**
```bash
npm run dev:client
```
Client will start on port 3000 and open in your browser.

### Production Mode

#### Build for Production
```bash
# Build all packages
npm run build

# Or build individually
npm run build --workspace=shared
npm run build --workspace=server
npm run build --workspace=client
```

#### Run Production Server
```bash
cd server
npm start
```

#### Serve Production Client
```bash
cd client
npm run preview
```

---

## LAN Multiplayer Setup

### Server Host Setup

1. **Find Your Local IP Address**

   **macOS/Linux:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   
   **Windows:**
   ```bash
   ipconfig
   ```
   
   Look for your IPv4 address (e.g., `192.168.1.100`)

2. **Start the Server**
   ```bash
   npm run dev:server
   ```
   
   The server will display:
   ```
   Server running on http://0.0.0.0:3001
   Local: http://localhost:3001
   Network: http://192.168.1.100:3001
   ```

3. **Configure Firewall**
   - Allow incoming connections on port 3001
   - **macOS**: System Preferences → Security & Privacy → Firewall → Firewall Options
   - **Windows**: Windows Defender Firewall → Allow an app
   - **Linux**: `sudo ufw allow 3001`

### Client Connection Setup

1. **Update Server URL**
   
   Edit `client/src/App.tsx` and change the server URL:
   ```typescript
   const serverUrl = 'http://192.168.1.100:3001'; // Replace with host's IP
   ```

2. **Start Client**
   ```bash
   npm run dev:client
   ```

3. **Join Game**
   - Open browser to `http://localhost:3000`
   - Enter your player name
   - Click "Join Game"

### Multiple Players on Same Network

Each player should:
1. Get the host's IP address (e.g., `192.168.1.100`)
2. Update their `client/src/App.tsx` with the host's IP
3. Run `npm run dev:client` on their machine
4. Open `http://localhost:3000` in their browser
5. Join the game with a unique name

**Note**: All players must be on the same local network (WiFi/Ethernet).

---

## Troubleshooting

### Server Won't Start

**Problem**: Port 3001 already in use
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution**:
```bash
# Find process using port 3001
lsof -i :3001          # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process
kill -9 <PID>          # macOS/Linux
taskkill /PID <PID> /F # Windows
```

### Client Won't Connect to Server

**Problem**: Connection refused or timeout

**Solutions**:
1. **Check server is running**: Visit `http://localhost:3001/health` in browser
2. **Verify IP address**: Ensure client has correct server IP in `App.tsx`
3. **Check firewall**: Temporarily disable firewall to test
4. **Check network**: Ensure all devices on same network
5. **Check CORS**: Server should allow all origins in development

### Cards Not Loading

**Problem**: Game shows "Loading..." indefinitely

**Solutions**:
1. **Rebuild shared package**:
   ```bash
   npm run build --workspace=shared
   ```
2. **Check CSV file**: Ensure `carddata.csv` exists in project root
3. **Check server logs**: Look for CSV parsing errors
4. **Restart server**: Stop and restart the server

### Drag-and-Drop Not Working

**Problem**: Cards won't drag or drop

**Solutions**:
1. **Check turn**: You can only drag cards during your turn
2. **Check browser**: Use Chrome, Firefox, or Safari (not IE)
3. **Check console**: Open browser DevTools (F12) for errors
4. **Clear cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Game State Desync

**Problem**: Players see different game states

**Solutions**:
1. **Refresh all clients**: Have all players refresh their browsers
2. **Restart game**: Stop server, restart, all players rejoin
3. **Check network**: Ensure stable connection for all players

### Build Errors

**Problem**: TypeScript compilation errors

**Solutions**:
1. **Clean install**:
   ```bash
   rm -rf node_modules package-lock.json
   rm -rf */node_modules */package-lock.json
   npm install
   ```
2. **Rebuild shared**:
   ```bash
   npm run build --workspace=shared
   ```
3. **Check Node version**: Ensure Node.js 18+

---

## Game Rules Quick Reference

### Objective
Be the first player to collect **3 complete property sets** of different colors.

### Turn Structure
1. **Draw Phase**: Draw 2 cards (or 5 if hand is empty)
2. **Play Phase**: Play up to 3 cards
3. **Discard Phase**: Discard down to 7 cards if needed

### Card Types

#### Money Cards
- Bank for cash value
- Use to pay debts

#### Property Cards
- Play to your property area
- Group by color to complete sets
- Charge rent when you have matching rent cards

#### Property Wildcards
- Can be any color (dual-color or 10-color)
- Move between colors during your turn
- 10-color wildcard has NO monetary value

#### Action Cards
- **Pass Go**: Draw 2 extra cards
- **Sly Deal**: Steal a property (not from complete set)
- **Forced Deal**: Swap properties with opponent
- **Deal Breaker**: Steal entire complete set
- **Debt Collector**: Collect $5M from one player
- **It's My Birthday**: Collect $2M from all players
- **Just Say No**: Counter any action (doesn't count as a play)
- **House**: Add to complete set (+$3M rent)
- **Hotel**: Add to complete set with house (+$4M rent)
- **Double the Rent**: Play with rent card to double amount

#### Rent Cards
- Charge rent to opponents
- Must own matching property color
- Wild rent targets one player, others target all

### Important Rules

1. **3-Card Limit**: Maximum 3 cards played per turn (Just Say No doesn't count)
2. **7-Card Hand Limit**: Must discard to 7 at end of turn
3. **No Change**: Overpayment is lost
4. **Property Payment**: Properties go to opponent's property area, not bank
5. **Wildcard Mobility**: Can move wildcards even if it breaks complete sets
6. **Building Restrictions**: Houses/Hotels only on complete sets (not Railroad/Utility)

### Winning
- First player to complete 3 different colored property sets wins
- Game ends immediately when win condition is met

---

## Development Commands

### Root Commands
```bash
npm install              # Install all dependencies
npm run build           # Build all packages
npm run dev             # Run server and client together
npm run dev:server      # Run server only
npm run dev:client      # Run client only
```

### Workspace Commands
```bash
# Shared package
npm run build --workspace=shared

# Server package
npm run dev --workspace=server
npm run build --workspace=server
npm start --workspace=server

# Client package
npm run dev --workspace=client
npm run build --workspace=client
npm run preview --workspace=client
```

### Testing Commands
```bash
# Run test scripts
cd server
npx ts-node src/test-deck.ts        # Test card loading
npx ts-node src/test-game-init.ts   # Test game initialization
npx ts-node src/test-phase3.ts      # Test turn management
npx ts-node src/test-phase4.ts      # Test networking
npx ts-node src/test-phase5.ts      # Test action cards
npx ts-node src/test-phase7.ts      # Comprehensive test suite
```

---

## Support

### Getting Help
1. Check this SETUP.md file
2. Review IMPLEMENTATION_PLAN.md for architecture details
3. Check phase completion reports (PHASE1_COMPLETION.md through PHASE7_COMPLETION.md)
4. Review AGENTS.md for development guidelines

### Reporting Issues
When reporting issues, include:
- Node.js version (`node --version`)
- npm version (`npm --version`)
- Operating system
- Error messages (full stack trace)
- Steps to reproduce

---

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Shared package built (`npm run build --workspace=shared`)
- [ ] Server started (`npm run dev:server`)
- [ ] Client started (`npm run dev:client`)
- [ ] Browser opened to `http://localhost:3000`
- [ ] Game joined with player name

**Ready to play!** 🎮

---

*Made with Bob*