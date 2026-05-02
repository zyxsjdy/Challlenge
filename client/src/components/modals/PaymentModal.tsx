import React, { useState } from 'react';
import { PaymentRequiredPayload } from 'shared/events';
import { useGame } from '../../contexts/GameContext';
import { Card } from 'shared/types';
import CardComponent from '../CardComponent';

interface PaymentModalProps {
  data: PaymentRequiredPayload;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ data }) => {
  const { submitPayment, closePaymentModal, gameState, playerId } = useGame();
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const localPlayer = gameState?.players.find(p => p.id === playerId);
  if (!localPlayer) return null;

  // Get all cards that can be used for payment (bank + properties, excluding 10-color wildcard)
  const availableCards: Card[] = [
    ...localPlayer.bank,
    ...Array.from(localPlayer.properties.values()).flat()
  ].filter(card => {
    // Exclude 10-color wildcard (value is 0)
    return card.monetaryValue > 0;
  });

  const selectedValue = selectedCards.reduce((sum, cardId) => {
    const card = availableCards.find(c => c.id === cardId);
    return sum + (card?.monetaryValue || 0);
  }, 0);

  const handleCardClick = (cardId: string) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else {
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  const handleSubmit = () => {
    if (selectedValue >= data.amount) {
      submitPayment(selectedCards);
    }
  };

  const fromPlayerName = gameState?.players.find(p => p.id === data.fromPlayerId)?.name || 'You';
  const toPlayerName = gameState?.players.find(p => p.id === data.toPlayerId)?.name || 'Opponent';

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Payment Required</h2>
        <div className="modal-content">
          <p><strong>{data.reason}</strong></p>
          <p>{fromPlayerName} must pay ${data.amount}M to {toPlayerName}</p>
          
          <div className="payment-amount">
            Selected: ${selectedValue}M / ${data.amount}M
          </div>

          <div className="payment-selection">
            <h3>Select cards to pay:</h3>
            <div className="payment-cards">
              {availableCards.map(card => (
                <div 
                  key={card.id}
                  className={`payment-card ${selectedCards.includes(card.id) ? 'selected' : ''}`}
                  onClick={() => handleCardClick(card.id)}
                >
                  <CardComponent card={card} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={selectedValue < data.amount}
          >
            Pay ${selectedValue}M
          </button>
          <button className="btn btn-secondary" onClick={closePaymentModal}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

// Made with Bob