import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SanitizedGameState, Card, ActionCard } from 'shared/types';
import {
  ActionRequiresTargetPayload,
  PaymentRequiredPayload,
  ReactionPromptPayload,
  PlayerJoinedPayload
} from 'shared/events';
import { socketService } from '../services/socketService';
import { PropertyColor, GamePhase } from 'shared/enums';

interface GameContextType {
  gameState: SanitizedGameState | null;
  isConnected: boolean;
  playerId: string | null;
  
  // Modal states
  targetModalData: ActionRequiresTargetPayload | null;
  paymentModalData: PaymentRequiredPayload | null;
  reactionModalData: ReactionPromptPayload | null;
  dualUseModalData: { card: Card } | null;
  colorSelectionModalData: { card: Card; onSelect: (color: PropertyColor) => void } | null;
  propertySelectionModalData: {
    targetPlayerId: string;
    myProperties: Record<PropertyColor, Card[]>;
    theirProperties: Record<PropertyColor, Card[]>;
  } | null;
  rentColorModalData: {
    card: Card;
    availableColors: PropertyColor[];
    isWildRent: boolean;
  } | null;
  buildingPlacementModalData: {
    card: ActionCard;
    completedSets: PropertyColor[];
    properties: Record<PropertyColor, Card[]>;
  } | null;
  completedSetSelectionModalData: {
    targetPlayerId: string;
    completedSets: PropertyColor[];
  } | null;
  
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
  swapWildcardColor: (cardId: string, newColor: PropertyColor) => void;
  
  // Modal controls
  closeTargetModal: () => void;
  closePaymentModal: () => void;
  closeReactionModal: () => void;
  closeDualUseModal: () => void;
  showDualUseModal: (card: Card) => void;
  closeColorSelectionModal: () => void;
  showColorSelectionModal: (card: Card, onSelect: (color: PropertyColor) => void) => void;
  closePropertySelectionModal: () => void;
  showPropertySelectionModal: (targetPlayerId: string, myProps: Record<PropertyColor, Card[]>, theirProps: Record<PropertyColor, Card[]>) => void;
  closeRentColorModal: () => void;
  showRentColorModal: (card: Card, availableColors: PropertyColor[], isWildRent: boolean) => void;
  closeBuildingPlacementModal: () => void;
  showBuildingPlacementModal: (card: ActionCard, completedSets: PropertyColor[], properties: Record<PropertyColor, Card[]>) => void;
  closeCompletedSetSelectionModal: () => void;
  showCompletedSetSelectionModal: (targetPlayerId: string, completedSets: PropertyColor[]) => void;
  
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
  const [colorSelectionModalData, setColorSelectionModalData] = useState<{ card: Card; onSelect: (color: PropertyColor) => void } | null>(null);
  const [propertySelectionModalData, setPropertySelectionModalData] = useState<{
    targetPlayerId: string;
    myProperties: Record<PropertyColor, Card[]>;
    theirProperties: Record<PropertyColor, Card[]>;
  } | null>(null);
  const [rentColorModalData, setRentColorModalData] = useState<{
    card: Card;
    availableColors: PropertyColor[];
    isWildRent: boolean;
  } | null>(null);
  const [buildingPlacementModalData, setBuildingPlacementModalData] = useState<{
    card: ActionCard;
    completedSets: PropertyColor[];
    properties: Record<PropertyColor, Card[]>;
  } | null>(null);
  const [completedSetSelectionModalData, setCompletedSetSelectionModalData] = useState<{
    targetPlayerId: string;
    completedSets: PropertyColor[];
  } | null>(null);
  
  // Toast state
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: string }>>([]);
  
  useEffect(() => {
    // Connect to server
    socketService.connect(serverUrl);
    
    // Setup event listeners
    const unsubscribeConnect = socketService.onConnect(() => {
      setIsConnected(true);
      
      // Set player ID from socket (will be updated when game state arrives)
      const socketId = socketService.getSocketId();
      if (socketId) {
        console.log('Setting playerId from socket:', socketId);
        setPlayerId(socketId);
      }
    });
    
    const unsubscribePlayerJoined = socketService.onPlayerJoined((data: PlayerJoinedPayload) => {
      // Also set playerId if this is our join event
      const socketId = socketService.getSocketId();
      if (socketId === data.playerId) {
        console.log('Setting playerId from player joined event:', socketId);
        setPlayerId(socketId);
      }
      
      // Build lobby state from player joined events
      setGameState(prevState => {
        // If we already have a real game state, don't override it
        if (prevState && prevState.phase !== 'WAITING_FOR_PLAYERS') {
          return prevState;
        }
        
        // Build or update lobby state
        const existingPlayers = prevState?.players || [];
        const playerExists = existingPlayers.some(p => p.id === data.playerId);
        
        const updatedPlayers = playerExists
          ? existingPlayers
          : [...existingPlayers, {
              id: data.playerId,
              name: data.playerName,
              handCount: 0,
              bank: [],
              properties: {} as Record<PropertyColor, Card[]>,
              completedSets: []
            }];
        
        return {
          players: updatedPlayers,
          currentPlayerId: null,
          phase: GamePhase.WAITING_FOR_PLAYERS,
          turnPlayCount: 0,
          drawPileCount: 0,
          discardPileTop: null,
          pendingAction: null,
          winner: null
        };
      });
    });
    
    const unsubscribeState = socketService.onGameStateUpdate((state) => {
      setGameState(state);
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
      unsubscribeConnect();
      unsubscribePlayerJoined();
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
  
  const swapWildcardColor = (cardId: string, newColor: PropertyColor) => {
    // Find the card's current color in player's properties
    if (!gameState || !playerId) return;
    
    const myPlayer = gameState.players.find(p => p.id === playerId);
    if (!myPlayer) return;
    
    // Find which color set the card is currently in
    let currentColor: PropertyColor | null = null;
    for (const [color, cards] of Object.entries(myPlayer.properties)) {
      if (cards.some(c => c.id === cardId)) {
        currentColor = color as PropertyColor;
        break;
      }
    }
    
    if (!currentColor) {
      console.error('Card not found in any property set');
      return;
    }
    
    // Use move_wildcard event to swap colors
    socketService.moveWildcard(cardId, currentColor, newColor);
  };
  
  // Modal controls
  const closeTargetModal = () => setTargetModalData(null);
  const closePaymentModal = () => setPaymentModalData(null);
  const closeReactionModal = () => setReactionModalData(null);
  const closeDualUseModal = () => setDualUseModalData(null);
  const showDualUseModal = (card: Card) => setDualUseModalData({ card });
  
  const closeColorSelectionModal = () => setColorSelectionModalData(null);
  const showColorSelectionModal = (card: Card, onSelect: (color: PropertyColor) => void) => {
    setColorSelectionModalData({ card, onSelect });
  };
  
  const closePropertySelectionModal = () => setPropertySelectionModalData(null);
  const showPropertySelectionModal = (
    targetPlayerId: string,
    myProps: Record<PropertyColor, Card[]>,
    theirProps: Record<PropertyColor, Card[]>
  ) => {
    setPropertySelectionModalData({
      targetPlayerId,
      myProperties: myProps,
      theirProperties: theirProps
    });
  };
  
  const closeRentColorModal = () => setRentColorModalData(null);
  const showRentColorModal = (card: Card, availableColors: PropertyColor[], isWildRent: boolean) => {
    setRentColorModalData({ card, availableColors, isWildRent });
  };
  
  const closeBuildingPlacementModal = () => setBuildingPlacementModalData(null);
  const showBuildingPlacementModal = (
    card: ActionCard,
    completedSets: PropertyColor[],
    properties: Record<PropertyColor, Card[]>
  ) => {
    setBuildingPlacementModalData({ card, completedSets, properties });
  };
  
  const closeCompletedSetSelectionModal = () => setCompletedSetSelectionModalData(null);
  const showCompletedSetSelectionModal = (targetPlayerId: string, completedSets: PropertyColor[]) => {
    setCompletedSetSelectionModalData({ targetPlayerId, completedSets });
  };
  
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
    colorSelectionModalData,
    propertySelectionModalData,
    rentColorModalData,
    buildingPlacementModalData,
    completedSetSelectionModalData,
    joinGame,
    startGame,
    playCard,
    selectTarget,
    submitPayment,
    respondToAction,
    drawCards,
    endTurn,
    discardCards,
    swapWildcardColor,
    closeTargetModal,
    closePaymentModal,
    closeReactionModal,
    closeDualUseModal,
    showDualUseModal,
    closeColorSelectionModal,
    showColorSelectionModal,
    closePropertySelectionModal,
    showPropertySelectionModal,
    closeRentColorModal,
    showRentColorModal,
    closeBuildingPlacementModal,
    showBuildingPlacementModal,
    closeCompletedSetSelectionModal,
    showCompletedSetSelectionModal,
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