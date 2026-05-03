import React, { useState } from 'react';
import { Card, PropertyCard } from 'shared/types';
import { PropertyColor } from 'shared/enums';
import CardComponent from '../CardComponent';

interface PropertySelectionModalProps {
  title: string;
  description: string;
  myProperties: Record<PropertyColor, Card[]>;
  theirProperties: Record<PropertyColor, Card[]>;
  onComplete: (myPropertyId: string, theirPropertyId: string) => void;
  onCancel: () => void;
}

const PropertySelectionModal: React.FC<PropertySelectionModalProps> = ({
  title,
  description,
  myProperties,
  theirProperties,
  onComplete,
  onCancel
}) => {
  const [selectedMyProperty, setSelectedMyProperty] = useState<string | null>(null);
  const [selectedTheirProperty, setSelectedTheirProperty] = useState<string | null>(null);
  const [step, setStep] = useState<'their' | 'my'>('their');

  const getAllProperties = (properties: Record<PropertyColor, Card[]>): Card[] => {
    const allProps: Card[] = [];
    Object.values(properties).forEach(cards => {
      cards.forEach(card => {
        if (card.category === 'PROPERTY' || card.category === 'PROPERTY_WILDCARD') {
          allProps.push(card);
        }
      });
    });
    return allProps;
  };

  const myPropertyCards = getAllProperties(myProperties);
  const theirPropertyCards = getAllProperties(theirProperties);

  const handlePropertyClick = (cardId: string, isMyProperty: boolean) => {
    if (step === 'their' && !isMyProperty) {
      setSelectedTheirProperty(cardId);
      setStep('my');
    } else if (step === 'my' && isMyProperty) {
      setSelectedMyProperty(cardId);
    }
  };

  const handleConfirm = () => {
    if (selectedMyProperty && selectedTheirProperty) {
      onComplete(selectedMyProperty, selectedTheirProperty);
    }
  };

  const handleBack = () => {
    if (step === 'my') {
      setStep('their');
      setSelectedMyProperty(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{description}</p>
        
        {step === 'their' && (
          <>
            <h3>Step 1: Select property you want from opponent</h3>
            <div className="property-selection-grid">
              {theirPropertyCards.map(card => (
                <div
                  key={card.id}
                  className={selectedTheirProperty === card.id ? 'selected-property' : ''}
                  onClick={() => handlePropertyClick(card.id, false)}
                >
                  <CardComponent card={card} selected={selectedTheirProperty === card.id} />
                </div>
              ))}
            </div>
          </>
        )}
        
        {step === 'my' && (
          <>
            <h3>Step 2: Select property you will give to opponent</h3>
            <div className="property-selection-grid">
              {myPropertyCards.map(card => (
                <div
                  key={card.id}
                  className={selectedMyProperty === card.id ? 'selected-property' : ''}
                  onClick={() => handlePropertyClick(card.id, true)}
                >
                  <CardComponent card={card} selected={selectedMyProperty === card.id} />
                </div>
              ))}
            </div>
          </>
        )}
        
        <div className="modal-buttons">
          {step === 'my' && (
            <button className="modal-button secondary" onClick={handleBack}>
              Back
            </button>
          )}
          <button className="modal-button cancel" onClick={onCancel}>
            Cancel
          </button>
          {step === 'my' && selectedMyProperty && (
            <button className="modal-button confirm" onClick={handleConfirm}>
              Confirm Swap
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertySelectionModal;

// Made with Bob