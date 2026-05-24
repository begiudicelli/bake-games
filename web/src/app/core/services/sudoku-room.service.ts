import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type {
  ClientMessage,
  Difficulty,
  PlayerState,
  RoomState,
  ServerMessage,
} from '@bake/shared/sudoku/sudoku-types';
import PartySocket from 'partysocket';
import { environment } from '../../environments/environment';

const initialState: RoomState = {
  puzzle: Array.from({ length: 9 }, () => Array(9).fill(0)) as number[][],
  difficulty: 'medium' as Difficulty,
  phase: 'waiting',
  players: {},
  winnerId: null,
};

@Injectable({ providedIn: 'root' })
export class SudokuRoomService implements OnDestroy {
  private readonly router = inject(Router);
  private socket: PartySocket | null = null;

  private readonly _state = signal<RoomState>(initialState);
  private readonly _connectionId = signal<string | null>(null);
  private readonly _connected = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly state = this._state.asReadonly();
  readonly connected = this._connected.asReadonly();
  readonly error = this._error.asReadonly();

  readonly myId = computed(() => this._connectionId());

  readonly myState = computed<PlayerState | null>(() => {
    const id = this._connectionId();
    if (!id) return null;
    return this._state().players[id] ?? null;
  });

  readonly opponentState = computed<PlayerState | null>(() => {
    const id = this._connectionId();
    if (!id) return null;
    const entry = Object.entries(this._state().players).find(([connId]) => connId !== id);
    return entry?.[1] ?? null;
  });

  readonly playersInfo = computed(() =>
    Object.entries(this._state().players).map(([id, p]) => ({
      id,
      ...p,
      isMe: id === this._connectionId(),
    })),
  );

  joinRoom(roomId: string, playerName: string, difficulty: Difficulty): void {
    this.leaveRoom();

    this.socket = new PartySocket({
      host: environment.partyKitHost,
      room: roomId,
      party: 'sudoku',
    });

    this.socket.addEventListener('open', () => {
      this._connected.set(true);
      this._connectionId.set(this.socket!.id);
      this.send({ type: 'JOIN', playerName, difficulty });
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

  placeNumber(row: number, col: number, value: number): void {
    this.send({ type: 'PLACE_NUMBER', row, col, value });
  }

  erase(row: number, col: number): void {
    this.send({ type: 'ERASE', row, col });
  }

  submit(): void {
    this.send({ type: 'SUBMIT' });
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
