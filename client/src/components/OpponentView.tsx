import React from 'react';
import { Card } from 'shared/types';
import { PropertyColor } from 'shared/enums';
import CardComponent from './CardComponent';

interface OpponentViewProps {
  player: {
    id: string;
    name: string;
    handCount: number;
    bank: Card[];
    properties: Record<PropertyColor, Card[]>;
    completedSets: PropertyColor[];
  };
  isCurrentPlayer: boolean;
}

const OpponentView: React.FC<OpponentViewProps> = ({ player, isCurrentPlayer }) => {
  const totalBankValue = player.bank.reduce((sum, card) => sum + card.monetaryValue, 0);

  return (
    <div className={`opponent-view ${isCurrentPlayer ? 'active' : ''}`}>
      <div className="opponent-header">
        <span className="opponent-name">{player.name}</span>
        <span className="opponent-hand-count">{player.handCount} cards</span>
      </div>

      <div className="opponent-tableau">
        {/* Bank */}
        <div className="opponent-bank">
          <h4>Bank: ${totalBankValue}M</h4>
          <div className="bank-cards">
            {player.bank.slice(0, 3).map(card => (
              <CardComponent key={card.id} card={card} />
            ))}
            {player.bank.length > 3 && (
              <div className="card">+{player.bank.length - 3}</div>
            )}
          </div>
        </div>

        {/* Properties */}
        <div className="opponent-properties">
          <h4>Properties ({player.completedSets.length} complete sets)</h4>
          <div className="property-sets-display">
            {Object.entries(player.properties).map(([color, cards]) => {
              if (cards.length === 0) return null;
              
              const propertyColor = color as PropertyColor;
              const isComplete = player.completedSets.includes(propertyColor);
              const colorName = color.replace(/_/g, ' ').toLowerCase()
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              return (
                <div
                  key={color}
                  className={`opponent-property-set ${isComplete ? 'completed' : ''}`}
                >
                  <div className="property-set-header">
                    {colorName} {isComplete && '✓'}
                  </div>
                  <div className="property-cards-small">
                    {cards.map((card: Card) => (
                      <CardComponent key={card.id} card={card} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpponentView;

// Made with Bob