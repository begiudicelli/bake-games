# 🎮 Guia: Como Adicionar um Novo Jogo

Este guia descreve como adicionar um novo jogo ao Bake Games seguindo a arquitetura modular do projeto.

## Estrutura de um Novo Jogo

Cada jogo requer componentes em 3 camadas:

```
1. Shared Types (@bake/shared)
   └── Contrato entre frontend e backend

2. Backend (Server)
   └── Lógica do jogo e sincronização de estado

3. Frontend (Web)
   └── Serviço, componentes e rotas
```

## Passo 1: Definir Tipos Compartilhados

### Arquivo: `packages/shared/src/[game-name]/[game-name]-types.ts`

```typescript
/**
 * Extend base types from common-types.ts
 */
import { BasePlayerState, BaseRoomState } from '../common-types';

// Game-specific types
export interface PlayerState extends BasePlayerState {
  // Add game-specific player properties
  score: number;
  // ... other fields
}

export interface RoomState extends BaseRoomState {
  players: Record<string, PlayerState>;
  // Add game-specific room properties
  // ... other fields
}

// Message types
export type ClientMessage =
  | { type: 'JOIN'; playerName: string }
  | { type: 'MOVE'; data: any }  // Your custom messages
  | { type: 'RESTART' };

export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: RoomState }
  | { type: 'ERROR'; message: string };
```

### Atualizar: `packages/shared/src/index.ts`

```typescript
export * as [GameName] from './[game-name]/[game-name]-types';
```

## Passo 2: Criar Serviço Backend (PartyKit)

### Arquivo: `server/src/party/[game-name].ts`

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
    // ... game-specific initial state
  };
}

function createInitialPlayerState(name: string): [GameName].PlayerState {
  return {
    name,
    finished: false,
    // ... game-specific initial player state
  };
}

export default class [GameName]Server implements Party.Server {
  private state: [GameName].RoomState;

  constructor(readonly room: Party.Room) {
    this.state = createInitialState();
  }

  private broadcast(message: [GameName].ServerMessage): void {
    this.room.broadcast(JSON.stringify(message));
  }

  onConnect(conn: Party.Connection): void {
    this.state.players[conn.id] = createInitialPlayerState('Jogador');
    
    if (this.state.leaderId === null) {
      this.state.leaderId = conn.id;
    }
    
    conn.send(JSON.stringify({ type: 'STATE_UPDATE', state: this.state }));
  }

  onMessage(message: string, sender: Party.Connection): void {
    const parsed = JSON.parse(message) as [GameName].ClientMessage;
    const player = this.state.players[sender.id];

    if (!player) return;

    // Handle JOIN message
    if (parsed.type === 'JOIN') {
      player.name = parsed.playerName;
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    // Handle other game-specific messages
    // ... implement game logic
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

### Atualizar: `server/partykit.json`

```json
{
  "parties": {
    "[game-name]": "src/party/[game-name].ts"
  }
}
```

## Passo 3: Criar Serviço Frontend

### Arquivo: `web/src/app/core/services/[game-name]-room.service.ts`

```typescript
import { Injectable, OnDestroy, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { [GameName] } from '@bake/shared';
import { BaseRoomService } from './base-room.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class [GameName]RoomService 
  extends BaseRoomService<[GameName].RoomState, [GameName].ClientMessage, [GameName].ServerMessage>
  implements OnDestroy {
  
  private readonly router = inject(Router);

  protected getPartyName(): string {
    return '[game-name]';  // Must match partykit.json
  }

  protected getInitialState(): [GameName].RoomState {
    return {
      phase: 'waiting',
      players: {},
      currentTurnId: null,
      winnerId: null,
      leaderId: null,
    };
  }

  protected onConnected(playerName: string): void {
    this.send({ type: 'JOIN', playerName });
  }

  protected handleMessage(message: [GameName].ServerMessage): void {
    if (message.type === 'STATE_UPDATE') {
      this._state.set(message.state);
      this._error.set(null);
    }
    if (message.type === 'ERROR') {
      this._error.set(message.message);
    }
  }

  // Game-specific computed properties
  readonly playersInfo = computed(() =>
    Object.entries(this._state().players).map(([id, p]) => ({
      id,
      ...p,
      isMe: id === this._connectionId(),
    })),
  );

  readonly isMyTurn = computed(() => {
    const id = this._connectionId();
    return id !== null && this._state().currentTurnId === id;
  });

  // ... other game-specific methods
  
  ngOnDestroy(): void {
    this.leaveRoom();
  }
}
```

## Passo 4: Criar Componentes Frontend

### Estrutura Recomendada

```
web/src/app/features/[game-name]/
├── [game-name]-page/
│   ├── [game-name]-page.component.ts
│   ├── [game-name]-page.component.html
│   └── [game-name]-page.component.scss
├── game-board/
│   ├── game-board.component.ts
│   ├── game-board.component.html
│   └── game-board.component.scss
├── game-status/
│   ├── game-status.component.ts
│   ├── game-status.component.html
│   └── game-status.component.scss
└── ... (other specific components)
```

### Página Principal: `[game-name]-page.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { [GameName]RoomService } from '../../../core/services/[game-name]-room.service';
import { GameBoardComponent } from '../game-board/game-board.component';
import { GameStatusComponent } from '../game-status/game-status.component';

@Component({
  selector: 'app-[game-name]-page',
  standalone: true,
  imports: [CommonModule, GameBoardComponent, GameStatusComponent],
  templateUrl: './[game-name]-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class [GameName]PageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly roomService = inject([GameName]RoomService);

  roomId = '';

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') ?? '';
    const playerName = history.state?.playerName;

    if (!playerName) {
      this.router.navigate([`/join/[game-name]`, this.roomId]);
      return;
    }

    this.roomService.joinRoom(this.roomId, playerName);
  }

  ngOnDestroy(): void {
    this.roomService.leaveRoom();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
```

## Passo 5: Adicionar Rota

### Arquivo: `web/src/app/app.routes.ts`

```typescript
{
  path: '[game-name]/:roomId',
  loadComponent: () =>
    import('./features/[game-name]/[game-name]-page/[game-name]-page.component')
      .then((m) => m.[GameName]PageComponent),
},
```

## Passo 6: Atualizar Home Page

### Arquivo: `web/src/app/features/home/home-page/home.component.ts`

Adicione o novo jogo à lista de jogos disponíveis:

```typescript
this.games.set([
  // ... existing games
  {
    name: '[Game Name]',
    description: 'Game description',
    route: '[game-name]',
  },
]);
```

## Padrões Recomendados

### 1. Naming Conventions

- **Pasta**: `kebab-case` (ex: `tic-tac-toe`)
- **Arquivo**: `kebab-case.component.ts`
- **Classe**: `PascalCase` (ex: `TicTacToePageComponent`)
- **Party Name**: `lowercase` sem hyphens (ex: `tictactoe`)
- **Serviço**: `PascalCase` com `Service` suffix (ex: `TicTacToeRoomService`)

### 2. Type Safety

- Sempre use tipos do `@bake/shared`
- Estenda `BaseRoomState` e `BasePlayerState`
- Use `type` para unions, nunca `any`

### 3. Change Detection

- Use `ChangeDetectionStrategy.OnPush` em todos os componentes
- Use `signal()` e `computed()` para reatividade
- Nunca use `Subject` ou `Observable` chains

### 4. Component Structure

```typescript
@Component({
  selector: 'app-component-name',
  standalone: true,  // Always standalone
  imports: [CommonModule, ...],
  templateUrl: './component-name.component.html',
  styleUrl: './component-name.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### 5. Service Lifecycle

- Implementar `OnDestroy` em serviços com sockets
- Sempre fazer cleanup de conexões
- Usar `signal.asReadonly()` para expor estado

## Exemplo Completo: Jogo Simples

Para um jogo simples (ex: Pedra, Papel, Tesoura), veja os passos acima aplicados a um caso real.

## Dicas e Boas Práticas

1. **Reutilize componentes comuns**: Use `room-info`, `join-room-page` etc.
2. **Testes**: Adicione `.spec.ts` para cada componente e serviço
3. **Estado**: O servidor é fonte única de verdade
4. **Broadcast**: Use broadcast para sincronizar estado com todos os clientes
5. **Validação**: Valide tudo no servidor, não confie no cliente
6. **Performance**: Não envie dados desnecessários em broadcasts

## Troubleshooting

- **Conexão não funciona**: Verifique o `party` name em `partykit.json`
- **Tipos não reconhecidos**: Certifique-se que exportou em `@bake/shared/index.ts`
- **Componente não renderiza**: Verifique `standalone: true` e `imports`
- **Estado não sincroniza**: Valide que browser recebe STATE_UPDATE corretamente

---

Para dúvidas, consulte os jogos existentes (Yahtzee, Tic Tac Toe, Sudoku) como referência.
