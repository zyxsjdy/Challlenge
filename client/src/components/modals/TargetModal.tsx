import React, { useState } from 'react';
import { ActionRequiresTargetPayload } from 'shared/events';
import { useGame } from '../../contexts/GameContext';

interface TargetModalProps {
  data: ActionRequiresTargetPayload;
}

const TargetModal: React.FC<TargetModalProps> = ({ data }) => {
  const { selectTarget, closeTargetModal, gameState } = useGame();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selectedTarget) {
      selectTarget({ targetPlayerId: selectedTarget });
    }
  };

  const getActionDescription = () => {
    switch (data.actionType) {
      case 'SLY_DEAL':
        return 'Select an opponent to steal a property from (not from a complete set)';
      case 'FORCED_DEAL':
        return 'Select an opponent to swap properties with';
      case 'DEAL_BREAKER':
        return 'Select an opponent to steal a complete property set from';
      case 'DEBT_COLLECTOR':
        return 'Select an opponent to collect $5M from';
      case 'BIRTHDAY':
        return 'All opponents will pay you $2M';
      case 'RENT':
        return 'Select an opponent to charge rent';
      default:
        return 'Select a target player';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Select Target</h2>
        <div className="modal-content">
          <p>{getActionDescription()}</p>
          
          <div className="target-list">
            {data.validTargets.map(targetId => {
              const player = gameState?.players.find(p => p.id === targetId);
              if (!player) return null;
              
              return (
                <div
                  key={targetId}
                  className={`target-item ${selectedTarget === targetId ? 'selected' : ''}`}
                  onClick={() => setSelectedTarget(targetId)}
                >
                  <strong>{player.name}</strong>
                  <div>
                    <span>Hand: {player.handCount} cards</span>
                    <span> | Bank: ${player.bank.reduce((sum, c) => sum + c.monetaryValue, 0)}M</span>
                    <span> | Sets: {player.completedSets.length}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={!selectedTarget}
          >
            Select Target
          </button>
          <button className="btn btn-secondary" onClick={closeTargetModal}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TargetModal;

// Made with Bob