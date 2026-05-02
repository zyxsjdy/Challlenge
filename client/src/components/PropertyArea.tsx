import React, { useState } from 'react';
import { Card } from 'shared/types';
import { PropertyColor, CardCategory } from 'shared/enums';
import { GAME_CONSTANTS } from 'shared/constants';
import { useGame } from '../contexts/GameContext';
import CardComponent from './CardComponent';

interface PropertyAreaProps {
  properties: Map<PropertyColor, Card[]>;
  isMyTurn: boolean;
}

const PropertyArea: React.FC<PropertyAreaProps> = ({ properties, isMyTurn }) => {
  const { playCard } = useGame();
  const [dragOverColor, setDragOverColor] = useState<PropertyColor | null>(null);
  const getSetSize = (color: PropertyColor): number => {
    return GAME_CONSTANTS.PROPERTY_SET_SIZES[color] || 0;
  };

  const isSetComplete = (color: PropertyColor, cards: Card[]): boolean => {
    const requiredSize = getSetSize(color);
    const propertyCount = cards.filter(c => 
      c.category === 'PROPERTY' || c.category === 'PROPERTY_WILDCARD'
    ).length;
    return propertyCount >= requiredSize;
  };

  const getHouseHotel = (cards: Card[]): { hasHouse: boolean; hasHotel: boolean } => {
    const hasHouse = cards.some(c => (c as any).hasHouse);
    const hasHotel = cards.some(c => (c as any).hasHotel);
    return { hasHouse, hasHotel };
  };

  const getColorName = (color: PropertyColor): string => {
    return color.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleDragOver = (color: PropertyColor) => (e: React.DragEvent) => {
    e.preventDefault();
    const cardCategory = e.dataTransfer.getData('cardCategory');
    
    // Only allow property cards
    if (cardCategory === CardCategory.PROPERTY || cardCategory === CardCategory.PROPERTY_WILDCARD) {
      setDragOverColor(color);
    }
  };

  const handleDragLeave = () => {
    setDragOverColor(null);
  };

  const handleDrop = (color: PropertyColor) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColor(null);
    
    const cardId = e.dataTransfer.getData('cardId');
    const cardCategory = e.dataTransfer.getData('cardCategory');
    
    // Validate card can be played as property
    if (cardCategory === CardCategory.PROPERTY || cardCategory === CardCategory.PROPERTY_WILDCARD) {
      playCard(cardId, { area: 'properties', targetColor: color });
    }
  };

  return (
    <div className="property-area">
      {Array.from(properties.entries()).map(([color, cards]) => {
        const completed = isSetComplete(color, cards);
        const { hasHouse, hasHotel } = getHouseHotel(cards);
        const setSize = getSetSize(color);
        const propertyCount = cards.filter(c =>
          c.category === 'PROPERTY' || c.category === 'PROPERTY_WILDCARD'
        ).length;

        return (
          <div
            key={color}
            className={`property-set ${completed ? 'completed' : ''} ${dragOverColor === color ? 'drag-over' : ''}`}
            onDragOver={handleDragOver(color)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(color)}
          >
            <h4>{getColorName(color)} ({propertyCount}/{setSize})</h4>
            
            {completed && (
              <div className="set-complete-indicator">✓</div>
            )}
            
            <div className="property-cards">
              {cards.map(card => (
                <CardComponent 
                  key={card.id} 
                  card={card}
                  draggable={isMyTurn && card.category === 'PROPERTY_WILDCARD'}
                />
              ))}
            </div>
            
            {(hasHouse || hasHotel) && (
              <div className="upgrade-indicator">
                {hasHouse && <div className="house-icon">H</div>}
                {hasHotel && <div className="hotel-icon">H+</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PropertyArea;

// Made with Bob