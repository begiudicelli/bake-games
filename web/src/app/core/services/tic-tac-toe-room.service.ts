import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { ClientMessage, Player, PlayerInfo, RoomState, ServerMessage } from '@bake/shared';
import PartySocket from 'partysocket';
import { environment } from '../../environments/environment';

const initialState: RoomState = {
  board: Array(9).fill(null),
  currentTurn: 'X',
  phase: 'waiting',
  players: {},
  winner: null,
};

@Injectable({ providedIn: 'root' })
export class TicTacToeRoomService implements OnDestroy {
  private readonly router = inject(Router);
  private socket: PartySocket | null = null;

  private readonly _state = signal<RoomState>(initialState);
  private readonly _connectionId = signal<string | null>(null);
  private readonly _connected = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly state = this._state.asReadonly();
  readonly connected = this._connected.asReadonly();
  readonly error = this._error.asReadonly();

  readonly myInfo = computed<PlayerInfo | null>(() => {
    const id = this._connectionId();
    if (!id) return null;
    return this._state().players[id] ?? null;
  });

  readonly mySymbol = computed<Player | null>(() => this.myInfo()?.symbol ?? null);

  readonly isMyTurn = computed(() => {
    const symbol = this.mySymbol();
    return symbol !== null && this._state().currentTurn === symbol;
  });

  readonly playersInfo = computed(() => {
    return Object.values(this._state().players);
  });

  joinRoom(roomId: string, playerName: string): void {
    this.leaveRoom();

    this.socket = new PartySocket({
      host: environment.partyKitHost,
      room: roomId,
      party: 'tictactoe',
    });

    this.socket.addEventListener('open', () => {
      this._connected.set(true);
      this._connectionId.set(this.socket!.id);
      this.send({ type: 'JOIN', playerName });
    });

    this.socket.addEventListener('message', (event: MessageEvent) => {
      const message = JSON.parse(event.data) as ServerMessage;
      if (message.type === 'STATE_UPDATE') {
        this._state.set(message.state);
        this._error.set(null);
      }
      if (message.type === 'ERROR') {
        this._error.set(message.message);
        if (message.message === 'Sala cheia.') {
          this.router.navigate(['/']);
        }
      }
    });

    this.socket.addEventListener('close', () => {
      this._connected.set(false);
    });
  }

  sendMove(index: number): void {
    if (!this.isMyTurn()) return;
    this.send({ type: 'MOVE', index });
  }

  sendRestart(): void {
    this.send({ type: 'RESTART' });
  }

  leaveRoom(): void {
    this.socket?.close();
    this.socket = null;
    this._state.set(initialState);
    this._connected.set(false);
    this._connectionId.set(null);
    this._error.set(null);
  }

  ngOnDestroy(): void {
    this.leaveRoom();
  }

  private send(message: ClientMessage): void {
    this.socket?.send(JSON.stringify(message));
  }
}
