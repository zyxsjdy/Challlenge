import React from 'react';
import { GameProvider } from './contexts/GameContext';
import GameBoard from './components/GameBoard';

const App: React.FC = () => {
  return (
    <GameProvider serverUrl="http://localhost:3001">
      <GameBoard />
    </GameProvider>
  );
};

export default App;

// Made with Bob