import React from 'react';
import { Card } from 'shared/types';
import { useGame } from '../../contexts/GameContext';

interface DualUseModalProps {
  card: Card;
}

const DualUseModal: React.FC<DualUseModalProps> = ({ card }) => {
  const { playCard, closeDualUseModal } = useGame();

  const handlePlayAsAction = () => {
    playCard(card.id, { area: 'action' });
    closeDualUseModal();
  };

  const handleBankAsCash = () => {
    playCard(card.id, { area: 'bank' });
    closeDualUseModal();
  };

  return (
    <div className="modal-overlay" onClick={closeDualUseModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Play Card</h2>
        <div className="modal-content">
          <p><strong>{card.name}</strong></p>
          <p>This card can be played as an action or banked for ${card.monetaryValue}M.</p>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handlePlayAsAction}>
            Play as Action
          </button>
          <button className="btn btn-secondary" onClick={handleBankAsCash}>
            Bank as ${card.monetaryValue}M
          </button>
          <button className="btn btn-secondary" onClick={closeDualUseModal}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DualUseModal;

// Made with Bob