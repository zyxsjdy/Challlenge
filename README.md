# 🎮 Monopoly Deal - Online Multiplayer Card Game
 
A real-time multiplayer implementation of the popular Monopoly Deal card game, built with modern web technologies and powered by IBM Bob AI.
 
## 📖 Introduction
 
Monopoly Deal is a fast-paced card game where 2-5 players compete to be the first to collect three complete property sets. This digital implementation brings the excitement of the physical card game to your browser with real-time multiplayer gameplay, interactive UI, and full game mechanics including:
 
- **Property Collection**: Build complete property sets to win
- **Action Cards**: Use strategic cards like Rent, Deal Breaker, and Forced Deal
- **Money Management**: Bank money cards and pay rent to opponents
- **Reaction System**: Counter opponent actions with "Just Say No" cards
- **Real-time Gameplay**: Instant updates across all connected players
 
## 🎯 Motivation
 
This project was created as part of the **IBM Bob Dev Day Hackathon 2026** to demonstrate:
 
1. **Modern Web Architecture**: Showcasing a full-stack TypeScript application with real-time communication
2. **Game Logic Implementation**: Complex rule enforcement and state management for multiplayer card games
3. **User Experience**: Intuitive UI/UX design for an engaging gaming experience
4. **AI-Assisted Development**: Leveraging IBM Bob AI to accelerate development and maintain code quality
 
The goal was to create a production-ready, scalable multiplayer game that demonstrates best practices in software engineering while providing an entertaining gaming experience.
 
## 🙏 Acknowledgements
 
### IBM Bob AI
 
This project was **developed with IBM Bob**, IBM's advanced AI coding assistant. Bob played a crucial role in:
 
- **Architecture Design**: Helping structure the client-server architecture and game state management
- **Code Generation**: Accelerating development with intelligent code suggestions and implementations
- **Problem Solving**: Assisting with complex game logic, real-time synchronization, and bug fixes
- **Best Practices**: Ensuring code quality, TypeScript type safety, and maintainable architecture
 
**Special thanks to IBM for providing Bob AI** - a powerful tool that transformed the development process and enabled rapid iteration on complex features.
 
### IBM Bob Dev Day Hackathon 2026
 
This project was created for the IBM Bob Dev Day Hackathon, showcasing the capabilities of AI-assisted development in building real-world applications.
 
## 🚀 How to Run
 
### Prerequisites
 
- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- A modern web browser (Chrome, Firefox, Safari, or Edge)
 
### Installation & Setup
 
1. **Clone the repository**
   ```bash
   git clone https://github.com/zyxsjdy/Challlenge.git
   cd Challlenge
   ```
 
2. **Install dependencies**
   ```bash
   npm install
   ```
 
   This will install dependencies for all three packages (server, client, and shared).
 
3. **Start the server**
   
   Open a terminal and run:
   ```bash
   cd server
   npm run dev
   ```
   
   The server will start on `http://localhost:3001`
 
4. **Start the client**
   
   Open a **new terminal** and run:
   ```bash
   cd client
   npm run dev
   ```
   
   The client will start on `http://localhost:3000`
 
5. **Play the game**
   
   - Open your browser and navigate to `http://localhost:3000`
   - Enter your name to join the game
   - Wait for 2-5 players to join
   - Click "Start Game" when ready
   - Enjoy playing Monopoly Deal!
 
### Quick Start (Alternative)
 
From the root directory, you can also use:
 
```bash
# Install all dependencies
npm install
 
# Start server (in one terminal)
npm run dev:server
 
# Start client (in another terminal)
npm run dev:client
```
 
## 🎮 How to Play
 
1. **Join Game**: Enter your name on the login screen
2. **Wait for Players**: Game requires 2-5 players to start
3. **Take Turns**: Each player can play up to 3 cards per turn
4. **Collect Properties**: Build complete property sets
5. **Use Actions**: Play action cards strategically
6. **Win**: First player to collect 3 complete property sets wins!
 
### Game Controls
 
- **Click cards** in your hand to play them
- **Drag properties** to organize your tableau
- **Click "End Turn"** when you're done playing
- **Respond to prompts** for payments, reactions, and selections
 
## 🏗️ Project Structure
 
```
Challlenge/
├── client/          # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # Game state management
│   │   ├── services/     # Socket.io client
│   │   └── styles/       # CSS styling
│   └── public/           # Static assets
├── server/          # Node.js + TypeScript backend
│   └── src/
│       ├── actions/      # Game action handlers
│       ├── game/         # Core game engine
│       ├── network/      # Socket.io server
│       └── utils/        # Utilities
└── shared/          # Shared types and constants
    └── src/
        ├── types.ts      # TypeScript interfaces
        ├── enums.ts      # Game enumerations
        └── events.ts     # Socket event definitions
```
 
## 🛠️ Technology Stack
 
- **Frontend**: React, TypeScript, Vite, Socket.io Client
- **Backend**: Node.js, TypeScript, Socket.io, Express
- **Real-time Communication**: Socket.io for bidirectional event-based communication
- **State Management**: React Context API
- **Build Tools**: Vite (client), ts-node (server)
 
## 📝 Features
 
- ✅ Real-time multiplayer (2-5 players)
- ✅ Complete Monopoly Deal card game rules
- ✅ Interactive drag-and-drop interface
- ✅ Action cards with target selection
- ✅ Payment and reaction system
- ✅ Property set management
- ✅ Win condition detection
- ✅ Responsive design
- ✅ Beautiful UI with animations
 
## 🐛 Troubleshooting
 
### Port Already in Use
 
If you see "EADDRINUSE" error:
```bash
# Windows
taskkill /F /IM node.exe
 
# Mac/Linux
killall node
```
 
Then restart the server and client.
 
### Connection Issues
 
- Ensure both server and client are running
- Check that server is on port 3001 and client on port 3000
- Clear browser cache and reload
 
### Game State Issues
 
- Refresh the browser to reconnect
- Restart both server and client if issues persist
 
## 📄 License
 
This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.
 
## 🤝 Contributing
 
Contributions are welcome! Please feel free to submit a Pull Request.
 
## 📧 Contact
 
For questions or feedback about this project, please open an issue on GitHub.
 
---
 
**Made with ❤️ using IBM Bob AI** | **IBM Bob Dev Day Hackathon 2026**
