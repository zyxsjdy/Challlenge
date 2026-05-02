import React from 'react';
import { Card, PropertyCard } from 'shared/types';
import { CardCategory, PropertyColor } from 'shared/enums';

interface CardComponentProps {
  card: Card;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onClick?: () => void;
  selected?: boolean;
}

const CardComponent: React.FC<CardComponentProps> = ({ 
  card, 
  draggable = false,
  onDragStart,
  onClick,
  selected = false
}) => {
  const getCardClass = () => {
    const classes = ['card'];
    
    if (card.category === CardCategory.PROPERTY) {
      const propCard = card as PropertyCard;
      classes.push(`property-${propCard.color.toLowerCase().replace('_', '-')}`);
    } else if (card.category === CardCategory.PROPERTY_WILDCARD) {
      classes.push('property-wildcard');
    } else if (card.category === CardCategory.MONEY) {
      classes.push('money');
    } else if (card.category === CardCategory.ACTION) {
      classes.push('action');
    } else if (card.category === CardCategory.RENT) {
      classes.push('rent');
    }
    
    if (selected) {
      classes.push('selected');
    }
    
    return classes.join(' ');
  };

  return (
    <div 
      className={getCardClass()}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <div className="card-name">{card.name}</div>
      {card.monetaryValue > 0 && (
        <div className="card-value">${card.monetaryValue}M</div>
      )}
    </div>
  );
};

export default CardComponent;

// Made with Bob