import React from 'react';
import { Card } from 'shared/types';
import { CardCategory } from 'shared/enums';
import { useGame } from '../contexts/GameContext';
import CardComponent from './CardComponent';

interface PlayerHandProps {
  cards: Card[];
  isMyTurn: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ cards, isMyTurn }) => {
  const { playCard, showDualUseModal } = useGame();

  const handleCardDragStart = (card: Card) => (e: React.DragEvent) => {
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('cardCategory', card.category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardClick = (card: Card) => {
    if (!isMyTurn) return;

    // Check if card has dual use (action with monetary value)
    if (card.category === CardCategory.ACTION && card.monetaryValue > 0) {
      showDualUseModal(card);
      return;
    }

    // For action/rent cards, they need to be dragged or will trigger targeting
    if (card.category === CardCategory.ACTION || card.category === CardCategory.RENT) {
      // These will be handled by drag-and-drop or will show targeting modal
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