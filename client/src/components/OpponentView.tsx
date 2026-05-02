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
    properties: Map<PropertyColor, Card[]>;
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
          <h4>Sets: {player.completedSets.length}</h4>
          <div className="property-sets-mini">
            {Array.from(player.properties.entries()).map(([color, cards]) => {
              const isComplete = player.completedSets.includes(color);
              return (
                <div 
                  key={color} 
                  className={`property-set-mini ${isComplete ? 'completed' : ''}`}
                  title={`${color}: ${cards.length} cards`}
                >
                  {cards.length}
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