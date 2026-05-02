import React from 'react';
import { GamePhase } from 'shared/enums';

interface TurnIndicatorProps {
  currentPlayer: { id: string; name: string } | undefined;
  isMyTurn: boolean;
  phase: GamePhase;
  turnPlayCount: number;
}

const TurnIndicator: React.FC<TurnIndicatorProps> = ({ 
  currentPlayer, 
  isMyTurn, 
  phase,
  turnPlayCount 
}) => {
  const getPhaseText = () => {
    switch (phase) {
      case GamePhase.WAITING_FOR_PLAYERS:
        return 'Waiting for players...';
      case GamePhase.PLAYING:
        return `Playing (${turnPlayCount}/3 cards played)`;
      case GamePhase.AWAITING_TARGET:
        return 'Select target...';
      case GamePhase.AWAITING_PAYMENT:
        return 'Awaiting payment...';
      case GamePhase.AWAITING_REACTION:
        return 'Awaiting reaction...';
      case GamePhase.AWAITING_DISCARD:
        return 'Discard cards...';
      case GamePhase.GAME_OVER:
        return 'Game Over!';
      default:
        return '';
    }
  };

  return (
    <div className={`turn-indicator ${isMyTurn ? 'active' : ''}`}>
      <h2>{currentPlayer ? currentPlayer.name : 'No player'}</h2>
      <p>{isMyTurn ? 'Your Turn' : 'Opponent\'s Turn'}</p>
      <p className="phase-text">{getPhaseText()}</p>
    </div>
  );
};

export default TurnIndicator;

// Made with Bob