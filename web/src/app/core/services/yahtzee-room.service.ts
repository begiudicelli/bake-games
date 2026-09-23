import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Yahtzee } from '@bake/shared';
import PartySocket from 'partysocket';
import { environment } from '../../environments/environment';

const initialState: Yahtzee.RoomState = {
  phase: 'waiting',
  players: {},
  currentTurnId: null,
  winnerId: null,
  leaderId: null,
};

@Injectable({ providedIn: 'root' })
export class YahtzeeRoomService implements OnDestroy {
  private readonly router = inject(Router);
  private socket: PartySocket | null = null;

  private readonly _state = signal<Yahtzee.RoomState>(initialState);
  private readonly _connectionId = signal<string | null>(null);
  private readonly _connected = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly state = this._state.asReadonly();
  readonly connected = this._connected.asReadonly();
  readonly error = this._error.asReadonly();

  readonly myId = computed(() => this._connectionId());

  readonly myState = computed<Yahtzee.PlayerState | null>(() => {
    const id = this._connectionId();
    if (!id) return null;
    return this._state().players[id] ?? null;
  });

  readonly playersInfo = computed(() =>
    Object.entries(this._state().players).map(([id, p]) => ({
      id,
      ...p,
      isMe: id === this._connectionId(),
      isCurrentTurn: id === this._state().currentTurnId,
    })),
  );

  readonly isMyTurn = computed(() => {
    const id = this._connectionId();
    return id !== null && this._state().currentTurnId === id;
  });

  readonly canRoll = computed(() => {
    const player = this.myState();
    return this.isMyTurn() && player !== null && player.rollsLeft > 0;
  });

  readonly canKeep = computed(() => {
    const player = this.myState();
    return this.isMyTurn() && player !== null && player.rollsLeft < 3;
  });

  readonly canSelectCategory = computed(() => {
    const player = this.myState();
    return this.isMyTurn() && player !== null && player.rollsLeft < 3;
  });

  readonly upperSectionProgress = computed(() => {
    const player = this.myState();
    if (!player) return 0;
    return player.upperSectionTotal;
  });

  readonly bonusReached = computed(() => {
    const player = this.myState();
    if (!player) return false;
    return player.bonus > 0;
  });

  readonly winner = computed(() => {
    const winnerId = this._state().winnerId;
    if (!winnerId) return null;
    return this._state().players[winnerId] ?? null;
  });

  joinRoom(roomId: string, playerName: string): void {
    this.leaveRoom();

    this.socket = new PartySocket({
      host: environment.partyKitHost,
      room: roomId,
      party: 'yahtzee',
    });

    this.socket.addEventListener('open', () => {
      this._connected.set(true);
      this._connectionId.set(this.socket!.id);
      this.send({ type: 'JOIN', playerName });
    });

    this.socket.addEventListener('message', (event: MessageEvent) => {
      const message = JSON.parse(event.data) as Yahtzee.ServerMessage;
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

  rollDice(): void {
    if (!this.canRoll()) return;
    this.send({ type: 'ROLL_DICE' });
  }

  toggleKeep(index: number): void {
    if (!this.canKeep()) return;
    this.send({ type: 'TOGGLE_KEEP', index });
  }

  selectCategory(category: Yahtzee.ScoreCategory): void {
    if (!this.canSelectCategory()) return;
    this.send({ type: 'SELECT_CATEGORY', category });
  }

  startGame(): void {
    this.send({ type: 'START' });
  }

  restart(): void {
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

  private send(message: Yahtzee.ClientMessage): void {
    this.socket?.send(JSON.stringify(message));
  }
}
