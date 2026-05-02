import { io, Socket } from 'socket.io-client';
import { SanitizedGameState } from 'shared/types';
import {
  ActionRequiresTargetPayload,
  PaymentRequiredPayload,
  ReactionPromptPayload,
  JoinGamePayload,
  PlayCardPayload,
  SelectTargetPayload,
  SelectPaymentPayload,
  ReactToActionPayload,
  DiscardCardsPayload
} from 'shared/events';

type GameStateCallback = (state: SanitizedGameState) => void;
type ActionRequiresTargetCallback = (data: ActionRequiresTargetPayload) => void;
type PaymentRequiredCallback = (data: PaymentRequiredPayload) => void;
type ReactionPromptCallback = (data: ReactionPromptPayload) => void;
type ErrorCallback = (error: string) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: {
    gameStateUpdate: GameStateCallback[];
    actionRequiresTarget: ActionRequiresTargetCallback[];
    paymentRequired: PaymentRequiredCallback[];
    reactionPrompt: ReactionPromptCallback[];
    error: ErrorCallback[];
  } = {
    gameStateUpdate: [],
    actionRequiresTarget: [],
    paymentRequired: [],
    reactionPrompt: [],
    error: []
  };

  connect(serverUrl: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('game_state_update', (state: SanitizedGameState) => {
      console.log('Game state update received:', state);
      this.listeners.gameStateUpdate.forEach(cb => cb(state));
    });

    this.socket.on('action_requires_target', (data: ActionRequiresTargetPayload) => {
      console.log('Action requires target:', data);
      this.listeners.actionRequiresTarget.forEach(cb => cb(data));
    });

    this.socket.on('payment_required', (data: PaymentRequiredPayload) => {
      console.log('Payment required:', data);
      this.listeners.paymentRequired.forEach(cb => cb(data));
    });

    this.socket.on('reaction_prompt', (data: ReactionPromptPayload) => {
      console.log('Reaction prompt:', data);
      this.listeners.reactionPrompt.forEach(cb => cb(data));
    });

    this.socket.on('error', (error: string) => {
      console.error('Server error:', error);
      this.listeners.error.forEach(cb => cb(error));
    });
  }

  // Event listener registration
  onGameStateUpdate(callback: GameStateCallback): () => void {
    this.listeners.gameStateUpdate.push(callback);
    return () => {
      this.listeners.gameStateUpdate = this.listeners.gameStateUpdate.filter(cb => cb !== callback);
    };
  }

  onActionRequiresTarget(callback: ActionRequiresTargetCallback): () => void {
    this.listeners.actionRequiresTarget.push(callback);
    return () => {
      this.listeners.actionRequiresTarget = this.listeners.actionRequiresTarget.filter(cb => cb !== callback);
    };
  }

  onPaymentRequired(callback: PaymentRequiredCallback): () => void {
    this.listeners.paymentRequired.push(callback);
    return () => {
      this.listeners.paymentRequired = this.listeners.paymentRequired.filter(cb => cb !== callback);
    };
  }

  onReactionPrompt(callback: ReactionPromptCallback): () => void {
    this.listeners.reactionPrompt.push(callback);
    return () => {
      this.listeners.reactionPrompt = this.listeners.reactionPrompt.filter(cb => cb !== callback);
    };
  }

  onError(callback: ErrorCallback): () => void {
    this.listeners.error.push(callback);
    return () => {
      this.listeners.error = this.listeners.error.filter(cb => cb !== callback);
    };
  }

  // Game actions
  joinGame(playerName: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('join_game', { playerName });
  }

  startGame(): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('start_game');
  }

  playCard(cardId: string, placement: any): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('play_card', { cardId, placement });
  }

  selectTarget(targetData: any): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('select_target', targetData);
  }

  submitPayment(cardIds: string[]): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('submit_payment', { cardIds });
  }

  respondToAction(response: 'accept' | 'counter'): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('respond_to_action', { response });
  }

  drawCards(): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('draw_cards');
  }

  endTurn(): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('end_turn');
  }

  discardCards(cardIds: string[]): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('discard_cards', { cardIds });
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Made with Bob