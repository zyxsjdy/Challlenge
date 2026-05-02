import React from 'react';
import { useGame } from '../contexts/GameContext';
import OpponentView from './OpponentView';
import CenterPiles from './CenterPiles';
import TurnIndicator from './TurnIndicator';
import BankArea from './BankArea';
import PropertyArea from './PropertyArea';
import PlayerHand from './PlayerHand';
import TargetModal from './modals/TargetModal';
import PaymentModal from './modals/PaymentModal';
import ReactionModal from './modals/ReactionModal';
import DualUseModal from './modals/DualUseModal';

const GameBoard: React.FC = () => {
  const { 
    gameState, 
    isConnected, 
    playerId,
    targetModalData,
    paymentModalData,
    reactionModalData,
    dualUseModalData
  } = useGame();

  // Loading state
  if (!isConnected || !gameState) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Connecting to server...</span>
      </div>
    );
  }

  // Find local player and opponents
  const localPlayer = gameState.players.find(p => p.id === playerId);
  const opponents = gameState.players.filter(p => p.id !== playerId);
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

  if (!localPlayer) {
    return (
      <div className="loading">
        <span>Waiting to join game...</span>
      </div>
    );
  }

  const isMyTurn = gameState.currentPlayerId === playerId;

  return (
    <div className="game-board">
      {/* Opponents Area */}
      <div className="opponents-area">
        {opponents.map(opponent => (
          <OpponentView 
            key={opponent.id} 
            player={opponent}
            isCurrentPlayer={opponent.id === gameState.currentPlayerId}
          />
        ))}
      </div>

      {/* Center Area */}
      <div className="center-area">
        <CenterPiles
          drawPileCount={gameState.drawPileCount}
          discardTop={gameState.discardPileTop}
        />
        <TurnIndicator 
          currentPlayer={currentPlayer}
          isMyTurn={isMyTurn}
          phase={gameState.phase}
          turnPlayCount={gameState.turnPlayCount}
        />
      </div>

      {/* Local Player Area */}
      <div className="local-player-area">
        <div className="tableau">
          <BankArea cards={localPlayer.bank} />
          <PropertyArea 
            properties={localPlayer.properties}
            isMyTurn={isMyTurn}
          />
        </div>
        <PlayerHand 
          cards={gameState.myHand || []}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* Modals */}
      {targetModalData && <TargetModal data={targetModalData} />}
      {paymentModalData && <PaymentModal data={paymentModalData} />}
      {reactionModalData && <ReactionModal data={reactionModalData} />}
      {dualUseModalData && <DualUseModal card={dualUseModalData.card} />}
    </div>
  );
};

export default GameBoard;

// Made with Bob