import { OnDestroy, signal, computed } from '@angular/core';
import PartySocket from 'partysocket';

export interface RoomServiceConfig {
  roomId: string;
  playerName: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  isMe: boolean;
}

/**
 * Base class for all game room services
 * Provides common functionality for multiplayer game management
 */
export abstract class BaseRoomService<
  RoomState,
  ClientMessage,
  ServerMessage
> implements OnDestroy {
  protected socket: PartySocket | null = null;

  protected readonly _state = signal<RoomState>(this.getInitialState());
  protected readonly _connectionId = signal<string | null>(null);
  protected readonly _connected = signal(false);
  protected readonly _error = signal<string | null>(null);

  readonly state = this._state.asReadonly();
  readonly connected = this._connected.asReadonly();
  readonly error = this._error.asReadonly();

  readonly myId = computed(() => this._connectionId());

  abstract readonly playersInfo: any;

  /**
   * Get the party name for PartyKit (e.g., 'yahtzee', 'tictactoe')
   */
  protected abstract getPartyName(): string;

  /**
   * Get initial game state
   */
  protected abstract getInitialState(): RoomState;

  /**
   * Handle incoming server messages
   */
  protected abstract handleMessage(message: ServerMessage): void;

  /**
   * Send message to server
   */
  protected send(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Join a game room
   */
  joinRoom(roomId: string, playerName: string): void {
    this.leaveRoom();

    const partyHost = this.getPartyHost();
    const partyName = this.getPartyName();

    this.socket = new PartySocket({
      host: partyHost,
      room: roomId,
      party: partyName,
    });

    this.socket.addEventListener('open', () => {
      this._connected.set(true);
      this._connectionId.set(this.socket!.id);
      this.onConnected(playerName);
    });

    this.socket.addEventListener('message', (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    this.socket.addEventListener('close', () => {
      this._connected.set(false);
    });

    this.socket.addEventListener('error', (event: Event) => {
      console.error('Socket error:', event);
    });
  }

  /**
   * Called when socket is connected
   */
  protected abstract onConnected(playerName: string): void;

  /**
   * Start the game (optional, implemented by game services)
   */
  startGame?(): void;

  /**
   * Leave the game room
   */
  leaveRoom(): void {
    this.socket?.close();
    this.socket = null;
    this._connected.set(false);
    this._connectionId.set(null);
  }

  /**
   * Get PartyKit host URL
   */
  protected getPartyHost(): string {
    if (typeof window !== 'undefined') {
      const env = (window as any).__ENV__ || {};
      return env.partyKitHost || 'localhost:1999';
    }
    return 'localhost:1999';
  }

  ngOnDestroy(): void {
    this.leaveRoom();
  }
}
