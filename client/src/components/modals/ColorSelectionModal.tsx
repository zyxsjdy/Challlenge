import React from 'react';
import { PropertyColor } from 'shared/enums';
import { Card, PropertyWildcard } from 'shared/types';

interface ColorSelectionModalProps {
  card: Card;
  onSelectColor: (color: PropertyColor) => void;
  onCancel: () => void;
}

const ColorSelectionModal: React.FC<ColorSelectionModalProps> = ({
  card,
  onSelectColor,
  onCancel
}) => {
  // Extract available colors from the wildcard card
  const wildcardCard = card as PropertyWildcard;
  const availableColors = wildcardCard.validColors || [];
  const getColorName = (color: PropertyColor): string => {
    return color.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getColorClass = (color: PropertyColor): string => {
    return `property-${color.toLowerCase().replace(/_/g, '-')}`;
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Select Property Color</h2>
        <p>Choose which color to play this wildcard as:</p>
        
        <div className="color-selection-grid">
          {availableColors.map(color => (
            <button
              key={color}
              className={`color-button card ${getColorClass(color)}`}
              onClick={() => onSelectColor(color)}
            >
              {getColorName(color)}
            </button>
          ))}
        </div>
        
        <button className="modal-button cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ColorSelectionModal;

// Made with Bob