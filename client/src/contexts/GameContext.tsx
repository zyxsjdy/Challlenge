import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SanitizedGameState, Card } from 'shared/types';
import { 
  ActionRequiresTargetPayload,
  PaymentRequiredPayload,
  ReactionPromptPayload
} from 'shared/events';
import { socketService } from '../services/socketService';

interface GameContextType {
  gameState: SanitizedGameState | null;
  isConnected: boolean;
  playerId: string | null;
  
  // Modal states
  targetModalData: ActionRequiresTargetPayload | null;
  paymentModalData: PaymentRequiredPayload | null;
  reactionModalData: ReactionPromptPayload | null;
  dualUseModalData: { card: Card } | null;
  
  // Actions
  joinGame: (playerName: string) => void;
  startGame: () => void;
  playCard: (cardId: string, placement: any) => void;
  selectTarget: (targetData: any) => void;
  submitPayment: (cardIds: string[]) => void;
  respondToAction: (response: 'accept' | 'counter') => void;
  drawCards: () => void;
  endTurn: () => void;
  discardCards: (cardIds: string[]) => void;
  
  // Modal controls
  closeTargetModal: () => void;
  closePaymentModal: () => void;
  closeReactionModal: () => void;
  closeDualUseModal: () => void;
  showDualUseModal: (card: Card) => void;
  
  // Toast notifications
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
  serverUrl?: string;
}

export const GameProvider: React.FC<GameProviderProps> = ({ 
  children, 
  serverUrl = 'http://localhost:3001' 
}) => {
  const [gameState, setGameState] = useState<SanitizedGameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  // Modal states
  const [targetModalData, setTargetModalData] = useState<ActionRequiresTargetPayload | null>(null);
  const [paymentModalData, setPaymentModalData] = useState<PaymentRequiredPayload | null>(null);
  const [reactionModalData, setReactionModalData] = useState<ReactionPromptPayload | null>(null);
  const [dualUseModalData, setDualUseModalData] = useState<{ card: Card } | null>(null);
  
  // Toast state
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: string }>>([]);
  
  useEffect(() => {
    // Connect to server
    socketService.connect(serverUrl);
    
    // Setup event listeners
    const unsubscribeState = socketService.onGameStateUpdate((state) => {
      setGameState(state);
      setIsConnected(true);
      
      // Set player ID from socket
      const socketId = socketService.getSocketId();
      if (socketId) {
        setPlayerId(socketId);
      }
    });
    
    const unsubscribeTarget = socketService.onActionRequiresTarget((data) => {
      setTargetModalData(data);
    });
    
    const unsubscribePayment = socketService.onPaymentRequired((data) => {
      setPaymentModalData(data);
    });
    
    const unsubscribeReaction = socketService.onReactionPrompt((data) => {
      setReactionModalData(data);
    });
    
    const unsubscribeError = socketService.onError((error) => {
      showToast(error, 'error');
    });
    
    // Cleanup
    return () => {
      unsubscribeState();
      unsubscribeTarget();
      unsubscribePayment();
      unsubscribeReaction();
      unsubscribeError();
      socketService.disconnect();
    };
  }, [serverUrl]);
  
  // Actions
  const joinGame = (playerName: string) => {
    socketService.joinGame(playerName);
  };
  
  const startGame = () => {
    socketService.startGame();
  };
  
  const playCard = (cardId: string, placement: any) => {
    socketService.playCard(cardId, placement);
  };
  
  const selectTarget = (targetData: any) => {
    socketService.selectTarget(targetData);
    setTargetModalData(null);
  };
  
  const submitPayment = (cardIds: string[]) => {
    socketService.submitPayment(cardIds);
    setPaymentModalData(null);
  };
  
  const respondToAction = (response: 'accept' | 'counter') => {
    socketService.respondToAction(response);
    setReactionModalData(null);
  };
  
  const drawCards = () => {
    socketService.drawCards();
  };
  
  const endTurn = () => {
    socketService.endTurn();
  };
  
  const discardCards = (cardIds: string[]) => {
    socketService.discardCards(cardIds);
  };
  
  // Modal controls
  const closeTargetModal = () => setTargetModalData(null);
  const closePaymentModal = () => setPaymentModalData(null);
  const closeReactionModal = () => setReactionModalData(null);
  const closeDualUseModal = () => setDualUseModalData(null);
  const showDualUseModal = (card: Card) => setDualUseModalData({ card });
  
  // Toast notifications
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };
  
  const value: GameContextType = {
    gameState,
    isConnected,
    playerId,
    targetModalData,
    paymentModalData,
    reactionModalData,
    dualUseModalData,
    joinGame,
    startGame,
    playCard,
    selectTarget,
    submitPayment,
    respondToAction,
    drawCards,
    endTurn,
    discardCards,
    closeTargetModal,
    closePaymentModal,
    closeReactionModal,
    closeDualUseModal,
    showDualUseModal,
    showToast
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </GameContext.Provider>
  );
};

// Made with Bob