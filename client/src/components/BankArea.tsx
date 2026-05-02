import React, { useState } from 'react';
import { Card } from 'shared/types';
import { CardCategory } from 'shared/enums';
import { useGame } from '../contexts/GameContext';
import CardComponent from './CardComponent';

interface BankAreaProps {
  cards: Card[];
}

const BankArea: React.FC<BankAreaProps> = ({ cards }) => {
  const { playCard } = useGame();
  const [isDragOver, setIsDragOver] = useState(false);
  const totalValue = cards.reduce((sum, card) => sum + card.monetaryValue, 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const cardCategory = e.dataTransfer.types.includes('text/plain')
      ? e.dataTransfer.getData('cardCategory')
      : null;
    
    // Only allow money cards or action cards with monetary value
    if (cardCategory === CardCategory.MONEY || cardCategory === CardCategory.ACTION) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const cardId = e.dataTransfer.getData('cardId');
    const cardCategory = e.dataTransfer.getData('cardCategory');
    
    // Validate card can be banked
    if (cardCategory === CardCategory.MONEY || cardCategory === CardCategory.ACTION) {
      playCard(cardId, { area: 'bank' });
    }
  };

  return (
    <div
      className={`bank-area drop-zone ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h3>Bank (${totalValue}M)</h3>
      <div className="bank-cards">
        {cards.map(card => (
          <CardComponent key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
};

export default BankArea;

// Made with Bob