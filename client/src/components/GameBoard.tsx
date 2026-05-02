import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GamePhase } from 'shared/enums';
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
    joinGame,
    startGame,
    endTurn,
    targetModalData,
    paymentModalData,
    reactionModalData,
    dualUseModalData
  } = useGame();

  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  // Debug: Log component state on every render
  console.log('GameBoard Render:', {
    isConnected,
    hasJoined,
    hasGameState: !!gameState,
    gamePhase: gameState?.phase,
    playerId,
    playerCount: gameState?.players?.length
  });

  // Show join screen if not connected or haven't joined yet
  if (!isConnected) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Connecting to server...</span>
      </div>
    );
  }

  // Show join form if haven't joined yet
  if (!hasJoined || !gameState) {
    return (
      <div className="join-screen">
        <div className="join-container">
          <h1>Monopoly Deal</h1>
          <div className="join-form">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && playerName.trim()) {
                  joinGame(playerName.trim());
                  setHasJoined(true);
                }
              }}
              autoFocus
            />
            <button
              onClick={() => {
                if (playerName.trim()) {
                  joinGame(playerName.trim());
                  setHasJoined(true);
                }
              }}
              disabled={!playerName.trim()}
            >
              Join Game
            </button>
          </div>
          <p className="join-info">
            Waiting for 2-5 players to join...
          </p>
        </div>
      </div>
    );
  }

  // Show lobby if game hasn't started yet
  if (gameState && gameState.phase === GamePhase.WAITING_FOR_PLAYERS) {
    const playerCount = gameState.players.length;
    const canStart = playerCount >= 2;
    
    return (
      <div className="join-screen">
        <div className="join-container">
          <h1>Monopoly Deal</h1>
          <div className="lobby-info">
            <h2>Players in Lobby ({playerCount}/5)</h2>
            <ul className="player-list">
              {gameState.players.map(player => (
                <li key={player.id}>{player.name}</li>
              ))}
            </ul>
            {canStart ? (
              <button className="start-button" onClick={startGame}>
                Start Game
              </button>
            ) : (
              <p className="waiting-message">
                Waiting for at least 2 players to start...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Safety check: ensure players array exists before accessing
  if (!gameState.players || gameState.players.length === 0) {
    return (
      <div className="loading">
        <span>Loading game...</span>
      </div>
    );
  }

  // Debug logging
  console.log('GameBoard Debug:', {
    playerId,
    players: gameState.players,
    playerIds: gameState.players.map(p => p.id)
  });

  // Find local player and opponents
  const localPlayer = gameState.players.find(p => p.id === playerId);
  const opponents = gameState.players.filter(p => p.id !== playerId);
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

  if (!localPlayer) {
    console.log('Local player not found!', { playerId, availablePlayerIds: gameState.players.map(p => p.id) });
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
        <div className="hand-and-controls">
          <PlayerHand
            cards={gameState.myHand || []}
            isMyTurn={isMyTurn}
          />
          <button
            className="end-turn-button"
            onClick={endTurn}
            disabled={!isMyTurn}
          >
            End Turn
          </button>
        </div>
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