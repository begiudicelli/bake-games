# 🎲 Game Development

Guia completo para adicionar um novo jogo ao Bake Games. Siga a arquitetura modular para garantir qualidade e reutilização.

## Índice
1. [Overview](#overview)
2. [Estrutura de um Jogo](#estrutura-de-um-jogo)
3. [Passo a Passo](#passo-a-passo)
4. [Exemplo Prático](#exemplo-prático)
5. [Checklist](#checklist)

---

## Overview

Adicionar um novo jogo envolve **3 camadas**:

```
1. Tipos Compartilhados (@bake/shared)
   └── Contrato entre frontend e backend

2. Backend (PartyKit)
   └── Lógica do jogo e sincronização

3. Frontend (Angular)
   └── UI, componentes e rotas
```

**Tempo estimado:** 2-3 horas para um jogo simples

---

## Estrutura de um Jogo

### Árvore de Arquivos

```
bake-games/
├── packages/shared/src/[game-name]/
│   ├── [game-name]-types.ts    # Tipos
│   └── [game-name]-generator.ts # Helpers (opcional)
│
├── server/src/party/
│   └── [game-name].ts           # Backend
│
└── web/src/app/features/[game-name]/
    ├── [game-name]-page/        # Container
    ├── game-board/              # Board visual
    ├── game-status/             # Status display
    └── [other-components]/      # Específicos do jogo
```

---

## Passo a Passo

### Passo 1: Definir Tipos Compartilhados

**Arquivo:** `packages/shared/src/[game-name]/[game-name]-types.ts`

```typescript
import { BasePlayerState, BaseRoomState } from '../common-types';

// Game-specific types
export interface PlayerState extends BasePlayerState {
  score: number;
  // Add your game-specific properties
}

export interface RoomState extends BaseRoomState {
  players: Record<string, PlayerState>;
  // Add game-specific state
}

// Message types (client → server)
export type ClientMessage =
  | { type: 'JOIN'; playerName: string }
  | { type: 'START' }
  | { type: 'MOVE'; data: any }  // Your custom message
  | { type: 'RESTART' };

// Message types (server → client)
export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: RoomState }
  | { type: 'ERROR'; message: string };
```

**Atualizar:** `packages/shared/src/index.ts`

```typescript
export * as [GameName] from './[game-name]/[game-name]-types';
```

### Passo 2: Implementar Backend (PartyKit)

**Arquivo:** `server/src/party/[game-name].ts`

```typescript
import { [GameName] } from '@bake/shared';
import type * as Party from 'partykit/server';

function createInitialState(): [GameName].RoomState {
  return {
    phase: 'waiting',
    players: {},
    currentTurnId: null,
    winnerId: null,
    leaderId: null,
    // Your game-specific fields
  };
}

function createInitialPlayerState(name: string): [GameName].PlayerState {
  return {
    name,
    score: 0,
    finished: false,
    // Your game-specific fields
  };
}

export default class [GameName]Server implements Party.Server {
  private state: [GameName].RoomState;
  private readonly maxPlayers = 8;

  constructor(readonly room: Party.Room) {
    this.state = createInitialState();
  }

  private broadcast(message: [GameName].ServerMessage): void {
    this.room.broadcast(JSON.stringify(message));
  }

  onConnect(conn: Party.Connection): void {
    const playerCount = Object.keys(this.state.players).length;

    if (playerCount >= this.maxPlayers) {
      conn.send(JSON.stringify({ type: 'ERROR', message: 'Sala cheia.' }));
      conn.close();
      return;
    }

    // Add player
    this.state.players[conn.id] = createInitialPlayerState('Jogador');

    // Set as leader if first
    if (this.state.leaderId === null) {
      this.state.leaderId = conn.id;
    }

    conn.send(JSON.stringify({ type: 'STATE_UPDATE', state: this.state }));
  }

  onMessage(message: string, sender: Party.Connection): void {
    const parsed = JSON.parse(message) as [GameName].ClientMessage;
    const player = this.state.players[sender.id];

    if (!player) return;

    // Handle JOIN
    if (parsed.type === 'JOIN') {
      player.name = parsed.playerName;
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    // Handle START
    if (parsed.type === 'START') {
      if (sender.id !== this.state.leaderId) return;
      if (this.state.phase !== 'waiting') return;

      this.state.phase = 'playing';
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    // Handle your game-specific messages
    if (parsed.type === 'MOVE') {
      // Validate and execute move
      // Update state
      // Broadcast updates
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    if (parsed.type === 'RESTART') {
      this.state = createInitialState();
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }
  }

  onClose(conn: Party.Connection): void {
    delete this.state.players[conn.id];

    if (Object.keys(this.state.players).length === 0) {
      this.state = createInitialState();
    }

    this.broadcast({ type: 'STATE_UPDATE', state: this.state });
  }
}
```

**Atualizar:** `server/partykit.json`

```json
{
  "parties": {
    "[game-name]": "src/party/[game-name].ts"
  }
}
```

### Passo 3: Implementar Frontend Service

**Arquivo:** `web/src/app/core/services/[game-name]-room.service.ts`

```typescript
import { Injectable, OnDestroy, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { [GameName] } from '@bake/shared';
import PartySocket from 'partysocket';
import { environment } from '../../environments/environment';

const initialState: [GameName].RoomState = {
  phase: 'waiting',
  players: {},
  currentTurnId: null,
  winnerId: null,
  leaderId: null,
};

@Injectable({ providedIn: 'root' })
export class [GameName]RoomService implements OnDestroy {
  private readonly router = inject(Router);
  private socket: PartySocket | null = null;

  private readonly _state = signal<[GameName].RoomState>(initialState);
  private readonly _connectionId = signal<string | null>(null);
  private readonly _connected = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly state = this._state.asReadonly();
  readonly connected = this._connected.asReadonly();
  readonly error = this._error.asReadonly();

  readonly playersInfo = computed(() =>
    Object.entries(this._state().players).map(([id, p]) => ({
      id,
      ...p,
      isMe: id === this._connectionId(),
    })),
  );

  joinRoom(roomId: string, playerName: string): void {
    this.leaveRoom();

    this.socket = new PartySocket({
      host: environment.partyKitHost,
      room: roomId,
      party: '[game-name]',
    });

    this.socket.addEventListener('open', () => {
      this._connected.set(true);
      this._connectionId.set(this.socket!.id);
      this.send({ type: 'JOIN', playerName });
    });

    this.socket.addEventListener('message', (event: MessageEvent) => {
      const message = JSON.parse(event.data) as [GameName].ServerMessage;
      if (message.type === 'STATE_UPDATE') {
        this._state.set(message.state);
      }
      if (message.type === 'ERROR') {
        this._error.set(message.message);
      }
    });

    this.socket.addEventListener('close', () => {
      this._connected.set(false);
    });
  }

  startGame(): void {
    this.send({ type: 'START' });
  }

  // Add your game-specific methods
  // sendMove(index: number): void { }

  private send(message: [GameName].ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  leaveRoom(): void {
    this.socket?.close();
    this.socket = null;
    this._connected.set(false);
    this._connectionId.set(null);
    this._error.set(null);
  }

  ngOnDestroy(): void {
    this.leaveRoom();
  }
}
```

### Passo 4: Implementar Componentes Frontend

**Página Principal:** `web/src/app/features/[game-name]/[game-name]-page/[game-name]-page.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { [GameName]RoomService } from '../../../core/services/[game-name]-room.service';
import { GameWaitingRoomComponent } from '../../../shared/components/game-waiting-room/game-waiting-room.component';
import { GameBoardComponent } from '../game-board/game-board.component';
import { GameStatusComponent } from '../game-status/game-status.component';

@Component({
  selector: 'app-[game-name]-page',
  standalone: true,
  imports: [CommonModule, GameWaitingRoomComponent, GameBoardComponent, GameStatusComponent],
  templateUrl: './[game-name]-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class [GameName]PageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly roomService = inject([GameName]RoomService);

  protected roomId = '';
  private readonly _playerName = signal('');
  readonly playerName = this._playerName.asReadonly();

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') ?? '';
    const playerName = history.state?.playerName;

    if (playerName) {
      this._playerName.set(playerName);
      sessionStorage.setItem('playerName', playerName);
    }
  }

  ngOnDestroy(): void {
    this.roomService.leaveRoom();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
```

**Template:** `web/src/app/features/[game-name]/[game-name]-page/[game-name]-page.component.html`

```html
<ng-container *ngIf="roomService.state().phase === 'waiting'">
  <app-game-waiting-room
    [roomService]="roomService"
    [roomId]="roomId"
    [gameName]="'[Game Name]'"
    [minPlayers]="1"
    [maxPlayers]="8"
    [initialPlayerName]="playerName()"
  />
</ng-container>

<ng-container *ngIf="roomService.state().phase !== 'waiting'">
  <main class="min-h-screen bg-gray-950 text-white p-8">
    <h1>{{ '[Game Name]' }}</h1>
    <app-game-board />
    <app-game-status />
  </main>
</ng-container>
```

### Passo 5: Adicionar Rota

**Arquivo:** `web/src/app/app.routes.ts`

```typescript
{
  path: '[game-name]/:roomId',
  loadComponent: () =>
    import('./features/[game-name]/[game-name]-page/[game-name]-page.component')
      .then((m) => m.[GameName]PageComponent),
},
```

### Passo 6: Integrar com Home

**Arquivo:** `web/src/app/features/home/home-page/home.component.ts`

Adicione o jogo à lista:

```typescript
readonly games: GameCard[] = [
  // ... existing games
  {
    id: '[game-name]',
    title: '[Game Name]',
    description: 'Your game description',
    players: '1-8 players',
    route: '/[game-name]',
    hasDifficulty: false, // true se seu jogo tem dificuldade
  },
];
```

---

## Exemplo Prático

### "Pedra, Papel, Tesoura"

```typescript
// types
export type Choice = 'rock' | 'paper' | 'scissors';
export interface PlayerState extends BasePlayerState {
  choice: Choice | null;
  wins: number;
}

// backend - onMessage
if (parsed.type === 'MOVE') {
  player.choice = parsed.choice;
  if (Object.values(this.state.players).every(p => p.choice !== null)) {
    // Ambos escolheram, determinar vencedor
    const choices = Object.entries(this.state.players);
    const [p1, p2] = choices;
    const winner = determineWinner(p1[1].choice, p2[1].choice);
    if (winner) {
      this.state.players[winner].wins++;
    }
    // Reset para próxima rodada
    for (const p of Object.values(this.state.players)) {
      p.choice = null;
    }
  }
  this.broadcast({ type: 'STATE_UPDATE', state: this.state });
}

// frontend - component
protected readonly myChoice = computed(() =>
  this.roomService.myState()?.choice ?? null
);
```

---

## Checklist

Antes de submeter seu novo jogo:

### Tipos & Backend
- [ ] `[game-name]-types.ts` criado
- [ ] Tipos exportados em `packages/shared/src/index.ts`
- [ ] Backend handler criado (`server/src/party/[game-name].ts`)
- [ ] `server/partykit.json` atualizado com nova party

### Frontend
- [ ] Room service criado
- [ ] Page component criado
- [ ] Game-specific components criados
- [ ] Rota adicionada em `app.routes.ts`
- [ ] Game adicionado em home.component.ts

### Qualidade
- [ ] TypeScript compila sem erros
- [ ] ESLint passa (`npm run lint`)
- [ ] Código formatado com Prettier
- [ ] 2+ players testados (multiplayer)
- [ ] Reconnection testada
- [ ] Erros de servidor tratados

### Documentação
- [ ] `README` menciona novo jogo
- [ ] Instruções para jogar (comentários no código)

---

## Script Automático (Opcional)

Para gerar estrutura base automaticamente:

```bash
./scripts/new-game.sh --name "Meu Jogo" --slug meu-jogo
```

Isso cria:
- `packages/shared/src/meu-jogo/`
- `server/src/party/meu-jogo.ts`
- `web/src/app/core/services/meu-jogo-room.service.ts`
- `web/src/app/features/meu-jogo/` (estrutura)

Depois customize conforme necessário.

---

## Próximas Seções Recomendadas

- 🏗️ [Architecture](./ARCHITECTURE.md) - Entender padrões
- 📡 [API Reference](./API.md) - Tipos detalhados
- 🤝 [Contributing](./CONTRIBUTING.md) - Code style
