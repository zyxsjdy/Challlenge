import React from 'react';
import { ReactionPromptPayload } from 'shared/events';
import { useGame } from '../../contexts/GameContext';

interface ReactionModalProps {
  data: ReactionPromptPayload;
}

const ReactionModal: React.FC<ReactionModalProps> = ({ data }) => {
  const { respondToAction, closeReactionModal, gameState } = useGame();

  const handleCounter = () => {
    respondToAction('counter');
  };

  const handleAccept = () => {
    respondToAction('accept');
  };

  const initiatorName = gameState?.players.find(p => p.id === data.initiatorId)?.name || 'Opponent';

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Action Played Against You</h2>
        <div className="modal-content">
          <p><strong>{initiatorName}</strong> played <strong>{data.actionType}</strong></p>
          {data.canCounter ? (
            <p>You can play "Just Say No" to counter this action.</p>
          ) : (
            <p>You don't have "Just Say No" in your hand.</p>
          )}
        </div>
        <div className="modal-actions">
          {data.canCounter && (
            <button className="btn btn-danger" onClick={handleCounter}>
              Play Just Say No
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleAccept}>
            Let it be
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReactionModal;

// Made with Bob