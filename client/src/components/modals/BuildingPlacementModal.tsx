import React, { useState } from 'react';
import { Card, ActionCard } from 'shared/types';
import { PropertyColor, ActionType } from 'shared/enums';
import { GAME_CONSTANTS } from 'shared/constants';

interface BuildingPlacementModalProps {
  card: ActionCard;
  completedSets: PropertyColor[];
  properties: Record<PropertyColor, Card[]>;
  onConfirm: (propertyColor: PropertyColor) => void;
  onCancel: () => void;
}

const BuildingPlacementModal: React.FC<BuildingPlacementModalProps> = ({
  card,
  completedSets,
  properties,
  onConfirm,
  onCancel
}) => {
  const [selectedColor, setSelectedColor] = useState<PropertyColor | null>(null);

  const isHouse = card.actionType === ActionType.HOUSE;
  const isHotel = card.actionType === ActionType.HOTEL;

  // Filter completed sets that can have buildings
  const validSets = completedSets.filter(color => {
    // Cannot place on Railroad or Utility
    if (color === PropertyColor.RAILROAD || color === PropertyColor.UTILITY) {
      return false;
    }

    const setCards = properties[color] || [];
    const hasHouse = setCards.some(c => (c as any).hasHouse);
    const hasHotel = setCards.some(c => (c as any).hasHotel);

    // For House: set must not already have a house
    if (isHouse && hasHouse) {
      return false;
    }

    // For Hotel: set must have a house but not a hotel
    if (isHotel && (!hasHouse || hasHotel)) {
      return false;
    }

    return true;
  });

  const getColorName = (color: PropertyColor): string => {
    return color.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getSetInfo = (color: PropertyColor): string => {
    const setCards = properties[color] || [];
    const propertyCount = setCards.filter(c => 
      c.category === 'PROPERTY' || c.category === 'PROPERTY_WILDCARD'
    ).length;
    const requiredSize = GAME_CONSTANTS.PROPERTY_SET_SIZES[color] || 0;
    const hasHouse = setCards.some(c => (c as any).hasHouse);
    const hasHotel = setCards.some(c => (c as any).hasHotel);

    let status = `${propertyCount}/${requiredSize} properties`;
    if (hasHouse) status += ' + House';
    if (hasHotel) status += ' + Hotel';
    
    return status;
  };

  const handleConfirm = () => {
    if (selectedColor) {
      onConfirm(selectedColor);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Place {card.name}</h2>
        <p>
          {isHouse && 'Select a completed property set to place the House on.'}
          {isHotel && 'Select a completed property set with a House to place the Hotel on.'}
        </p>
        
        {validSets.length === 0 ? (
          <div className="no-valid-sets">
            <p>
              {isHouse && 'No completed property sets available for House placement.'}
              {isHotel && 'No completed property sets with a House available for Hotel placement.'}
            </p>
            <p className="hint">
              {isHouse && 'You need a completed property set (not Railroad or Utility) without a House.'}
              {isHotel && 'You need a completed property set with a House but no Hotel.'}
            </p>
          </div>
        ) : (
          <div className="property-color-selection">
            {validSets.map(color => (
              <div
                key={color}
                className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                onClick={() => setSelectedColor(color)}
              >
                <div className={`color-indicator ${color.toLowerCase().replace(/_/g, '-')}`}></div>
                <div className="color-info">
                  <div className="color-name">{getColorName(color)}</div>
                  <div className="color-status">{getSetInfo(color)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="modal-buttons">
          <button className="modal-button cancel" onClick={onCancel}>
            Cancel
          </button>
          {validSets.length > 0 && selectedColor && (
            <button className="modal-button confirm" onClick={handleConfirm}>
              Place {card.name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildingPlacementModal;

// Made with Bob