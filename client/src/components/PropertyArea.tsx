import React, { useState } from 'react';
import { Card } from 'shared/types';
import { PropertyColor, CardCategory } from 'shared/enums';
import { GAME_CONSTANTS } from 'shared/constants';
import { useGame } from '../contexts/GameContext';
import CardComponent from './CardComponent';

interface PropertyAreaProps {
  properties: Record<PropertyColor, Card[]>;
  isMyTurn: boolean;
}

const PropertyArea: React.FC<PropertyAreaProps> = ({ properties, isMyTurn }) => {
  const { playCard, showColorSelectionModal, swapWildcardColor } = useGame();
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

  // Show all property colors, not just ones with cards
  const allColors = Object.values(PropertyColor);
  
  return (
    <div className="property-area">
      <h3 className="area-title">Properties</h3>
      <div className="property-sets">
        {allColors.map((propertyColor) => {
          const cards = properties[propertyColor] || [];
          const completed = isSetComplete(propertyColor, cards);
          const { hasHouse, hasHotel } = getHouseHotel(cards);
          const setSize = getSetSize(propertyColor);
          const propertyCount = cards.filter((c: Card) =>
            c.category === 'PROPERTY' || c.category === 'PROPERTY_WILDCARD'
          ).length;

          // Only show property sets that have cards or can accept drops
          if (cards.length === 0 && !isMyTurn) {
            return null;
          }

          return (
            <div
              key={propertyColor}
              className={`property-set ${completed ? 'completed' : ''} ${dragOverColor === propertyColor ? 'drag-over' : ''} ${cards.length === 0 ? 'empty' : ''}`}
              onDragOver={handleDragOver(propertyColor)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(propertyColor)}
            >
              <h4>{getColorName(propertyColor)} ({propertyCount}/{setSize})</h4>
              
              {completed && (
                <div className="set-complete-indicator">✓</div>
              )}
              
              <div className="property-cards">
                {cards.length > 0 ? (
                  cards.map((card: Card) => (
                    <div key={card.id} className="property-card-wrapper">
                      <CardComponent
                        card={card}
                        draggable={isMyTurn && card.category === 'PROPERTY_WILDCARD'}
                      />
                      {isMyTurn && card.category === 'PROPERTY_WILDCARD' && (
                        <button
                          className="swap-color-button"
                          onClick={() => {
                            showColorSelectionModal(card, (newColor: PropertyColor) => {
                              swapWildcardColor(card.id, newColor);
                            });
                          }}
                          title="Change wildcard color"
                        >
                          🔄
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-set-placeholder">Drop property here</div>
                )}
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
    </div>
  );
};

export default PropertyArea;

// Made with Bob