import React from 'react';
import { Card } from 'shared/types';

interface CenterPilesProps {
  drawPileCount: number;
  discardTop: Card | null;
}

const CenterPiles: React.FC<CenterPilesProps> = ({ drawPileCount, discardTop }) => {
  return (
    <div className="center-piles">
      {/* Draw Pile */}
      <div className="pile">
        <h3>Draw Pile</h3>
        <div className="pile-card draw-pile">
          {drawPileCount}
        </div>
      </div>

      {/* Discard Pile */}
      <div className="pile">
        <h3>Discard Pile</h3>
        <div className="pile-card discard-pile">
          {discardTop ? (
            <div className="card-name">{discardTop.name}</div>
          ) : (
            <span>Empty</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CenterPiles;

// Made with Bob