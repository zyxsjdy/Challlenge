import React from 'react';

interface VictoryModalProps {
  winnerName: string;
  onClose: () => void;
}

const VictoryModal: React.FC<VictoryModalProps> = ({ winnerName, onClose }) => {
  return (
    <div className="modal-overlay victory-overlay">
      <div className="modal victory-modal">
        <div className="victory-content">
          <div className="victory-icon">🎉</div>
          <h1 className="victory-title">Congratulations!</h1>
          <h2 className="victory-winner">{winnerName} Wins!</h2>
          <p className="victory-message">
            {winnerName} has completed 3 full property sets and won the game!
          </p>
          <div className="victory-trophy">🏆</div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary victory-btn" onClick={onClose}>
            Close Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default VictoryModal;

// Made with Bob