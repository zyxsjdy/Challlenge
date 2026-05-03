import React from 'react';
import { Card, RentCard, PropertyWildcard, ActionCard } from 'shared/types';
import { CardCategory, PropertyColor, ActionType } from 'shared/enums';
import { useGame } from '../contexts/GameContext';
import CardComponent from './CardComponent';

interface PlayerHandProps {
  cards: Card[];
  isMyTurn: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ cards, isMyTurn }) => {
  const { playCard, showDualUseModal, showColorSelectionModal, showRentColorModal, showBuildingPlacementModal, gameState, playerId } = useGame();

  const handleCardDragStart = (card: Card) => (e: React.DragEvent) => {
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('cardCategory', card.category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardClick = (card: Card) => {
    if (!isMyTurn) return;

    // Handle action cards
    if (card.category === CardCategory.ACTION) {
      const actionCard = card as ActionCard;
      
      // Check if card has dual use (action with monetary value) - show dual use modal FIRST
      // This includes House/Hotel cards which can be banked for $3M/$4M
      if (card.monetaryValue > 0) {
        showDualUseModal(card);
        return;
      }
      
      // Other action cards need to be dragged or will trigger targeting
      return;
    }

    // For wildcard properties, show color selection modal
    if (card.category === CardCategory.PROPERTY_WILDCARD) {
      showColorSelectionModal(card, (color: PropertyColor) => {
        playCard(card.id, {
          area: 'properties',
          color: color,
          targetColor: color
        });
      });
      return;
    }

    // For rent cards, show rent color selection modal
    if (card.category === CardCategory.RENT) {
      const rentCard = card as RentCard;
      const myPlayer = gameState?.players.find(p => p.id === playerId);
      
      if (myPlayer) {
        // Get colors player owns that match rent card's valid colors
        const availableColors: PropertyColor[] = [];
        for (const color of rentCard.validColors) {
          const properties = myPlayer.properties[color];
          if (properties && properties.length > 0) {
            availableColors.push(color);
          }
        }
        
        if (availableColors.length > 0) {
          showRentColorModal(card, availableColors, rentCard.isWild);
        }
      }
      return;
    }
  };

  return (
    <div className="player-hand">
      <h3>Your Hand ({cards.length} cards)</h3>
      <div className="hand-cards">
        {cards.map(card => (
          <CardComponent
            key={card.id}
            card={card}
            draggable={isMyTurn}
            onDragStart={handleCardDragStart(card)}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerHand;

// Made with Bob