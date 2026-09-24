# 🏗️ Architecture

Visão geral da arquitetura de Bake Games, padrões de design e como as peças se conectam.

## Índice
1. [Visão Geral](#visão-geral)
2. [Camadas](#camadas)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Padrões de Código](#padrões-de-código)
5. [Modularização](#modularização)
6. [Comunicação em Tempo Real](#comunicação-em-tempo-real)

---

## Visão Geral

Bake Games é uma **plataforma modular** para jogos multiplayer em tempo real.

```
┌─────────────────────────────────────┐
│   Frontend (Angular 19)              │
│  - Standalone Components             │
│  - Signals para reatividade          │
│  - Change Detection OnPush           │
└────────────────┬────────────────────┘
                 │
        WebSocket / JSON
                 │
┌────────────────▼────────────────────┐
│   Shared Types (@bake/shared)        │
│  - BaseRoomState                     │
│  - BasePlayerState                   │
│  - Game Contracts                    │
└────────────────┬────────────────────┘
                 │
        Message Protocol
                 │
┌────────────────▼────────────────────┐
│   Backend (PartyKit)                 │
│  - Room Handlers per game            │
│  - State Synchronization             │
│  - Game Logic                        │
└─────────────────────────────────────┘
```

### Princípios

| Princípio | Implementação |
|-----------|--------------|
| **Server as Source of Truth** | Frontend só lê estado, servidor é autoridade |
| **Modular** | Cada jogo é independente e reutiliza padrões |
| **Type-Safe** | TypeScript em frontend, backend e tipos compartilhados |
| **Real-time** | WebSocket (PartySocket) para comunicação |
| **Signals-first** | Angular Signals para reatividade (não RxJS) |

---

## Camadas

### 1. Frontend (Angular 19)

**Localização:** `web/src/app/`

**Características:**
- Componentes standalone (sem NgModules)
- Signals + Computed para reatividade
- Change detection OnPush (eficiente)
- Feature-based organization

**Estrutura:**
```
web/src/app/
├── core/services/           # Services para conexão (YahtzeeRoomService, etc)
├── features/                # Feature modules
│   ├── home/               # Home page
│   ├── yahtzee/            # Yahtzee game
│   ├── tic-tac-toe/        # Tic Tac Toe
│   └── sudoku/             # Sudoku
├── shared/                 # Components reutilizáveis
│   └── components/
│       ├── game-waiting-room/   # Sala de espera padronizada
│       ├── room-info/           # Info da sala
│       └── join-room-page/      # Entrada do jogo
└── app.routes.ts           # Rotas lazy-loaded
```

### 2. Shared Package (@bake/shared)

**Localização:** `packages/shared/src/`

**Responsabilidade:** Centralizar tipos e contratos

**Estrutura:**
```
packages/shared/src/
├── common-types.ts         # BaseRoomState, BasePlayerState
├── yahtzee/
│   └── yahtzee-types.ts    # Yahtzee-specific types
├── tic-tac-toe/
│   └── tic-tac-toe-types.ts
├── sudoku/
│   └── sudoku-types.ts
└── index.ts                # Exports
```

**Exemplo de Contrato (Yahtzee):**
```typescript
export interface RoomState extends BaseRoomState {
  players: Record<string, PlayerState>;
}

export interface PlayerState extends BasePlayerState {
  dice: Dice[];
  scores: Record<ScoreCategory, number>;
}

export type ClientMessage =
  | { type: 'JOIN'; playerName: string }
  | { type: 'START' }
  | { type: 'ROLL_DICE' }
  | { type: 'SELECT_CATEGORY'; category: ScoreCategory };

export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: RoomState }
  | { type: 'ERROR'; message: string };
```

### 3. Backend (PartyKit)

**Localização:** `server/src/party/`

**Características:**
- Room handlers per game (yahtzee-.ts, tic-tac-toe.ts, sudoku.ts)
- Gerencia conexão de jogadores
- Valida e executa ações
- Sincroniza estado

**Ciclo de Vida de uma Sala:**
```
1. onConnect(conn)
   - Adiciona jogador ao state
   - Envia STATE_UPDATE

2. onMessage(message, sender)
   - Valida ação (turn, permissions, state)
   - Atualiza state
   - Broadcast STATE_UPDATE

3. onClose(conn)
   - Remove jogador
   - Reset se vazio
```

---

## Fluxo de Dados

### Exemplo: Roll Dice em Yahtzee

```
┌──────────────────────────────────────────────────────────┐
│ 1. FRONTEND - User clicks "Roll"                          │
├──────────────────────────────────────────────────────────┤
│ Component (yahtzee-page)                                  │
│   ↓                                                        │
│ roomService.rollDice()                                    │
│   ↓                                                        │
│ socket.send({ type: 'ROLL_DICE' })                        │
└────────────────────┬─────────────────────────────────────┘
                     │ (WebSocket)
┌────────────────────▼─────────────────────────────────────┐
│ 2. BACKEND - Receive and validate                         │
├──────────────────────────────────────────────────────────┤
│ onMessage('{"type":"ROLL_DICE"}', sender)                 │
│   ↓                                                        │
│ Validate:                                                  │
│   - Is it sender's turn? (state.currentTurnId)           │
│   - Has rolls left? (player.rollsLeft > 0)               │
│   ↓                                                        │
│ If valid: rollDice(player)                               │
│ Update: state.players[id]                                │
│   ↓                                                        │
│ broadcast({ type: 'STATE_UPDATE', state })              │
└────────────────────┬─────────────────────────────────────┘
                     │ (WebSocket)
┌────────────────────▼─────────────────────────────────────┐
│ 3. FRONTEND - Receive and render                          │
├──────────────────────────────────────────────────────────┤
│ roomService._state.set(message.state)                     │
│   ↓                                                        │
│ Signal updates → Computed recalculate                     │
│   ↓                                                        │
│ OnPush change detection triggers                          │
│   ↓                                                        │
│ Template renders dice with new values                     │
└──────────────────────────────────────────────────────────┘
```

---

## Padrões de Código

### Frontend: Services com Signals

```typescript
@Injectable({ providedIn: 'root' })
export class YahtzeeRoomService implements OnDestroy {
  // Private writable signal
  private readonly _state = signal<Yahtzee.RoomState>(initialState);

  // Public read-only
  readonly state = this._state.asReadonly();

  // Computed (derived state)
  readonly myState = computed(() => {
    const id = this._connectionId();
    if (!id) return null;
    return this._state().players[id] ?? null;
  });

  joinRoom(roomId: string, playerName: string): void {
    this.socket = new PartySocket({ /* ... */ });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'STATE_UPDATE') {
        this._state.set(message.state);  // Replace entire state
      }
    });
  }

  ngOnDestroy(): void {
    this.leaveRoom();  // Cleanup
  }
}
```

### Components: Standalone + OnPush

```typescript
@Component({
  selector: 'app-yahtzee-dice',
  standalone: true,  // Always
  imports: [CommonModule],
  templateUrl: './dice.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,  // Always
})
export class YahtzeeDiceComponent {
  protected readonly roomService = inject(YahtzeeRoomService);

  protected readonly myDice = computed(() =>
    this.roomService.myState()?.dice ?? []
  );
}
```

### Backend: Room Handler Pattern

```typescript
export default class YahtzeeServer implements Party.Server {
  private state: Yahtzee.RoomState = createInitialState();

  onConnect(conn: Party.Connection): void {
    this.state.players[conn.id] = createInitialPlayerState('Jogador');
    this.broadcast({ type: 'STATE_UPDATE', state: this.state });
  }

  onMessage(message: string, sender: Party.Connection): void {
    const parsed = JSON.parse(message) as Yahtzee.ClientMessage;
    const player = this.state.players[sender.id];

    if (parsed.type === 'ROLL_DICE') {
      if (this.state.currentTurnId !== sender.id) return;  // Validate
      rollDice(player);
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
    }
  }

  onClose(conn: Party.Connection): void {
    delete this.state.players[conn.id];
    if (Object.keys(this.state.players).length === 0) {
      this.state = createInitialState();  // Reset
    }
  }
}
```

---

## Modularização

### Princípio: Cada Jogo é Independente

```
Estrutura de um Jogo (ex: Yahtzee)

1. Types (@bake/shared)
   packages/shared/src/yahtzee/yahtzee-types.ts

2. Backend (Server)
   server/src/party/yahtzee-.ts

3. Frontend Service
   web/src/app/core/services/yahtzee-room.service.ts

4. Frontend Components
   web/src/app/features/yahtzee/
   ├── yahtzee-page/
   ├── dice/
   ├── scoreboard/
   ├── lobby/
   └── game-status/

5. Routes (app.routes.ts)
   path: 'yahtzee/:roomId' → YahtzeePageComponent

6. Home Integration
   Adicionar jogo à lista em home.component.ts
```

### Reutilização

Para **adicionar novo jogo**, reutilize:
- `GameWaitingRoomComponent` (sala de espera)
- `BaseRoomService` (padrão de conexão)
- `common-types.ts` (tipos base)
- Padrões de arquivo (mesma estrutura)

---

## Comunicação em Tempo Real

### Protocol: WebSocket JSON

1. **Client → Server**
   ```json
   {
     "type": "ROLL_DICE"
   }
   ```

2. **Server → Client**
   ```json
   {
     "type": "STATE_UPDATE",
     "state": { "players": { "conn-id": { "dice": [1,2,3,4,5] } } }
   }
   ```

### Characteristics

| Aspecto | Implementação |
|---------|--------------|
| **Protocol** | WebSocket (via PartySocket) |
| **Format** | JSON strings |
| **Latency** | <100ms (typical) |
| **Authority** | Server validates all |
| **Sync** | Full state broadcast |

### Message Flow

```
Client                    Server                  Clients
  │                         │                       │
  ├─ JOIN ────────────────>  │                       │
  │                         ├─ Validate join         │
  │                         ├─ Add to state          │
  │                         ├─ Broadcast ───────────>│
  │                         │                    Update state
  │                         │                       │
  ├─ ROLL_DICE ───────────> │                       │
  │                         ├─ Validate turn         │
  │                         ├─ Update state          │
  │                         ├─ Broadcast ───────────>│
  │<───── STATE_UPDATE ──── │                       │
  │                         │<──── STATE_UPDATE ──── │
  │                         │                       │
```

---

## State Management

### Frontend: Signals

```typescript
// Writable (private)
private readonly _state = signal<RoomState>(initialState);

// Read-only (public)
readonly state = this._state.asReadonly();

// Computed (reactive derivation)
readonly myTurn = computed(() => 
  this._state().currentTurnId === this._connectionId()
);

// Update
this._state.set(newState);
```

### Backend: Immutable Mutations

```typescript
// Update player state
this.state.players[conn.id].rollsLeft--;

// Reset room
this.state = createInitialState();

// Broadcast
this.broadcast({ type: 'STATE_UPDATE', state: this.state });
```

---

## Convenções Naming

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Pasta | kebab-case | `tic-tac-toe/` |
| Arquivo | kebab-case | `game-board.component.ts` |
| Classe TS | PascalCase | `TicTacToePageComponent` |
| Party Name | lowercase (no hyphen) | `tictactoe` |
| Service | `[Name]RoomService` | `TicTacToeRoomService` |
| Signal (private) | `_name` | `_playerName` |

---

## Performance Considerations

1. **Change Detection:** OnPush + Signals (eficiente)
2. **Broadcasting:** Full state sent (PartyKit otimiza delta)
3. **Computed:** Cache automático (sem recomputation desnecessária)
4. **Components:** Lazy-loaded por rota

---

## Segurança

⚠️ **Atual:** Mínima (projeto de aprendizado)

### Validação de Servidor
- ✅ Turn-based actions validadas
- ✅ State mutations no servidor
- ❌ Sem autenticação
- ❌ Sem rate limiting
- ❌ Sem encryção de mensagens

### Recomendações Futuras
- Adicionar autenticação (JWT)
- Rate limiting por cliente
- Validação rigorosa de inputs
- TLS/WSS para produção

---

## Próximas Seções Recomendadas

- 📖 [Getting Started](./GETTING_STARTED.md) - Setup e run
- 🎲 [Game Development](./GAME_DEVELOPMENT.md) - Criar novo jogo
- 📡 [API Reference](./API.md) - Tipos detalhados
- 🤝 [Contributing](./CONTRIBUTING.md) - Boas práticas
