import React, { useState } from 'react';
import { PropertyColor } from 'shared/enums';
import { useGame } from '../../contexts/GameContext';

interface CompletedSetSelectionModalProps {
  targetPlayerId: string;
  completedSets: PropertyColor[];
  onClose: () => void;
}

const CompletedSetSelectionModal: React.FC<CompletedSetSelectionModalProps> = ({
  targetPlayerId,
  completedSets,
  onClose
}) => {
  const { selectTarget } = useGame();
  const [selectedColor, setSelectedColor] = useState<PropertyColor | null>(null);

  const handleSubmit = () => {
    if (!selectedColor) return;
    
    console.log('Submitting Deal Breaker with:', { targetPlayerId, propertyColor: selectedColor });
    selectTarget({ 
      targetPlayerId, 
      propertyColor: selectedColor 
    });
    onClose();
  };

  const getColorName = (color: PropertyColor): string => {
    return color.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getColorClass = (color: PropertyColor): string => {
    return color.toLowerCase().replace(/_/g, '-');
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Select Property Set to Steal</h2>
        <div className="modal-content">
          <p>Choose which completed property set you want to steal:</p>
          
          <div className="completed-sets-list">
            {completedSets.map(color => (
              <div
                key={color}
                className={`completed-set-item ${selectedColor === color ? 'selected' : ''} color-${getColorClass(color)}`}
                onClick={() => setSelectedColor(color)}
              >
                <div className="color-indicator"></div>
                <span className="color-name">{getColorName(color)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={!selectedColor}
          >
            Steal This Set
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletedSetSelectionModal;

// Made with Bob