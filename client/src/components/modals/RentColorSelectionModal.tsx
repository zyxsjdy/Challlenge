import React, { useState } from 'react';
import { PropertyColor } from 'shared/enums';
import { Card, RentCard } from 'shared/types';

interface RentColorSelectionModalProps {
  card: Card;
  availableColors: PropertyColor[];
  onSelectColor: (color: PropertyColor, targetPlayerId?: string) => void;
  onCancel: () => void;
  isWildRent: boolean;
  opponents?: Array<{ id: string; name: string }>;
}

const RentColorSelectionModal: React.FC<RentColorSelectionModalProps> = ({
  card,
  availableColors,
  onSelectColor,
  onCancel,
  isWildRent,
  opponents = []
}) => {
  const [selectedColor, setSelectedColor] = useState<PropertyColor | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const getColorName = (color: PropertyColor): string => {
    return color.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getColorClass = (color: PropertyColor): string => {
    return `property-${color.toLowerCase().replace(/_/g, '-')}`;
  };

  const handleConfirm = () => {
    if (selectedColor) {
      if (isWildRent && selectedTarget) {
        onSelectColor(selectedColor, selectedTarget);
      } else if (!isWildRent) {
        onSelectColor(selectedColor);
      }
    }
  };

  const canConfirm = selectedColor && (!isWildRent || selectedTarget);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Charge Rent</h2>
        <p>Select which property color to charge rent for:</p>
        
        <div className="color-grid">
          {availableColors.map(color => (
            <div
              key={color}
              className={`color-option ${getColorClass(color)} ${selectedColor === color ? 'selected' : ''}`}
              onClick={() => setSelectedColor(color)}
              style={{
                border: selectedColor === color ? '3px solid white' : '3px solid transparent'
              }}
            >
              {getColorName(color)}
            </div>
          ))}
        </div>

        {isWildRent && selectedColor && (
          <>
            <h3 style={{ marginTop: '20px' }}>Select Target Opponent:</h3>
            <div className="target-list">
              {opponents.map(opponent => (
                <div
                  key={opponent.id}
                  className={`target-item ${selectedTarget === opponent.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTarget(opponent.id)}
                >
                  <strong>{opponent.name}</strong>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="modal-buttons">
          <button className="modal-button cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="modal-button confirm"
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{ opacity: canConfirm ? 1 : 0.5 }}
          >
            Charge Rent
          </button>
        </div>
      </div>
    </div>
  );
};

export default RentColorSelectionModal;

// Made with Bob