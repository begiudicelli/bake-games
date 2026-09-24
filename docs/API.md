# 📡 API Reference

Referência completa de tipos, contratos e mensagens do Bake Games.

## Índice
1. [Common Types](#common-types)
2. [Yahtzee](#yahtzee)
3. [Tic Tac Toe](#tic-tac-toe)
4. [Sudoku](#sudoku)
5. [Message Protocol](#message-protocol)

---

## Common Types

Tipos base para todos os jogos (em `@bake/shared/common-types.ts`).

### GamePhase

```typescript
type GamePhase = 'waiting' | 'playing' | 'finished';
```

Estados do jogo:
- **waiting**: Aguardando jogadores
- **playing**: Jogo em andamento
- **finished**: Jogo terminou

### BasePlayerState

```typescript
interface BasePlayerState {
  name: string;
  finished: boolean;
}
```

Campos obrigatórios para todo jogador.

### BaseRoomState

```typescript
interface BaseRoomState {
  phase: GamePhase;
  players: Record<string, any>;
  currentTurnId: string | null;
  winnerId: string | null;
  leaderId: string | null;
}
```

Campos obrigatórios para toda sala de jogo.

---

## Yahtzee

Localização: `@bake/shared/yahtzee`

### Types

```typescript
type ScoreCategory =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'threeOfAKind' | 'fourOfAKind' | 'fullHouse'
  | 'smallStraight' | 'largeStraight' | 'yahtzee' | 'chance';

interface Dice {
  value: number;      // 1-6
  kept: boolean;
}

interface PlayerState extends BasePlayerState {
  dice: Dice[];                                    // 5 dados
  rollsLeft: number;                              // 0-3
  scores: Partial<Record<ScoreCategory, number>>; // Categorias preenchidas
  upperSectionTotal: number;
  bonus: number;      // 35 if upperSectionTotal >= 63
  totalScore: number;
  finished: boolean;
}

interface RoomState extends BaseRoomState {
  phase: GamePhase;
  players: Record<string, PlayerState>;
  currentTurnId: string | null;
  winnerId: string | null;
  leaderId: string | null;
}
```

### Messages

**Client → Server:**

```typescript
| { type: 'JOIN'; playerName: string }
| { type: 'START' }                    // Apenas líder
| { type: 'ROLL_DICE' }
| { type: 'TOGGLE_KEEP'; index: number }  // 0-4
| { type: 'SELECT_CATEGORY'; category: ScoreCategory }
| { type: 'RESTART' }                  // Apenas em finished
```

**Server → Client:**

```typescript
| { type: 'STATE_UPDATE'; state: RoomState }
| { type: 'ERROR'; message: string }
```

---

## Tic Tac Toe

Localização: `@bake/shared/tic-tac-toe`

### Types

```typescript
type Player = 'X' | 'O';
type Cell = Player | null;
type Board = Cell[];  // 9 células (0-8)

interface PlayerInfo {
  symbol: Player;  // 'X' ou 'O'
  name: string;
}

interface RoomState extends BaseRoomState {
  board: Board;              // Índices: 0-2 (linha 1), 3-5 (linha 2), 6-8 (linha 3)
  currentTurn: Player;       // 'X' sempre começa
  phase: GamePhase;
  players: Record<string, PlayerInfo>;
  winner: Player | 'draw' | null;
}
```

**Board Layout:**

```
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8
```

### Messages

**Client → Server:**

```typescript
| { type: 'JOIN'; playerName: string }
| { type: 'START' }
| { type: 'MOVE'; index: number }  // 0-8
| { type: 'RESTART' }
```

**Server → Client:**

```typescript
| { type: 'STATE_UPDATE'; state: RoomState }
| { type: 'ERROR'; message: string }
```

---

## Sudoku

Localização: `@bake/shared/sudoku`

### Types

```typescript
type Difficulty = 'easy' | 'medium' | 'hard';

interface PlayerState extends BasePlayerState {
  grid: number[][];     // 9x9 (0 = empty)
  progress: number;     // Células preenchidas
  finished: boolean;
  hasErrors: boolean;
  winner: boolean;
}

interface RoomState extends BaseRoomState {
  puzzle: number[][];   // 9x9 (clues from generator)
  difficulty: Difficulty;
  phase: GamePhase;
  players: Record<string, PlayerState>;
  winnerId: string | null;
}
```

**Difficulty:**
- **easy**: 46 clues
- **medium**: 36 clues
- **hard**: 26 clues

### Messages

**Client → Server:**

```typescript
| { type: 'JOIN'; playerName: string; difficulty: Difficulty }
| { type: 'START' }
| { type: 'PLACE_NUMBER'; row: number; col: number; value: number }
| { type: 'ERASE'; row: number; col: number }
| { type: 'SUBMIT' }  // Submeter solução
```

**Server → Client:**

```typescript
| { type: 'STATE_UPDATE'; state: RoomState }
| { type: 'ERROR'; message: string }
```

---

## Message Protocol

### General Structure

Todas as mensagens são **JSON strings**.

**Client → Server:**

```json
{
  "type": "ACTION_NAME",
  "...": "other fields"
}
```

**Server → Client:**

```json
{
  "type": "STATE_UPDATE" | "ERROR",
  "state": { /* RoomState */ },
  "message": "error message"
}
```

### Connection Flow

```
1. Client connects via WebSocket
   ↓
2. Client sends: { type: 'JOIN', playerName: 'Alice' }
   ↓
3. Server adds player to state
   ↓
4. Server broadcasts: { type: 'STATE_UPDATE', state: {...} }
   ↓
5. All clients receive and update local state
   ↓
6. Client renders updated UI
```

### Validation

**Server sempre valida:**

- ✅ Player está na sala?
- ✅ É sua vez? (para ações que requerem turno)
- ✅ Ação é válida nesta fase?
- ✅ Dados fazem sentido? (ex: índice 0-8 para Tic Tac Toe)

**Client nunca é autoridade:**

- ❌ Não assume que pode fazer ação
- ❌ Não modifica state localmente
- ❌ Espera confirmação do servidor

### Error Handling

Erros do servidor:

```typescript
{ type: 'ERROR', message: 'Não é sua vez.' }
{ type: 'ERROR', message: 'Sala cheia.' }
{ type: 'ERROR', message: 'Célula já ocupada.' }
```

Frontend deve:
- Mostrar erro ao usuário
- Manter UI sincronizada com servidor

---

## Room Service Interface

Padrão para serviços de jogo (ex: `YahtzeeRoomService`):

```typescript
// Properties
state: Signal<RoomState>;              // Read-only
connected: Signal<boolean>;
error: Signal<string | null>;
myId: Signal<string | null>;
playersInfo: Signal<PlayerInfo[]>;

// Methods
joinRoom(roomId: string, playerName: string): void;
leaveRoom(): void;
startGame?(): void;                    // Optional
send(message: ClientMessage): void;    // Protected
```

---

## Ambiente

### Environment Variables

**web/src/environments/environment.ts (dev):**

```typescript
export const environment = {
  production: false,
  partyKitHost: 'localhost:1999',
};
```

**web/src/environments/environment.prod.ts:**

```typescript
export const environment = {
  production: true,
  partyKitHost: 'game-platform.themaninthewall.partykit.dev',
};
```

---

## Status Codes

Para futuro (não implementado atualmente):

| Code | Meaning |
|------|---------|
| 200 | OK - Ação válida |
| 400 | Bad Request - Dados inválidos |
| 403 | Forbidden - Não autorizado |
| 409 | Conflict - Estado inválido |
| 500 | Server Error |

---

## WebSocket Events

Eventos emitidos pelo PartySocket:

```typescript
socket.addEventListener('open', () => {
  // Conectado, pronto para enviar
});

socket.addEventListener('message', (event: MessageEvent) => {
  const message = JSON.parse(event.data);
  // Processar mensagem
});

socket.addEventListener('close', () => {
  // Desconectado
});

socket.addEventListener('error', (event: Event) => {
  // Erro na conexão
});
```

---

## Exemplo Completo: Yahtzee ROLL_DICE

### 1. Cliente envia

```typescript
socket.send(JSON.stringify({
  type: 'ROLL_DICE'
}));
```

### 2. Servidor valida

```typescript
if (state.phase !== 'playing') return;  // Fase inválida
if (state.currentTurnId !== sender.id) return;  // Não é sua vez
if (player.rollsLeft <= 0) return;  // Sem rolagens
```

### 3. Servidor executa

```typescript
for (let i = 0; i < player.dice.length; i++) {
  if (!player.dice[i].kept) {
    player.dice[i].value = Math.floor(Math.random() * 6) + 1;
  }
}
player.rollsLeft--;
```

### 4. Servidor broadcast

```typescript
broadcast({
  type: 'STATE_UPDATE',
  state: {
    players: {
      [sender.id]: {
        dice: [{value: 3, kept: false}, ...],
        rollsLeft: 1,
        ...
      }
    },
    ...
  }
});
```

### 5. Cliente recebe

```typescript
roomService._state.set(message.state);
// Signals update → Computed recalculate
// Change detection triggers → Template re-renders
```

### 6. UI atualiza

```html
<div>Rollou: {{ myDice()[0].value }}, {{ myDice()[1].value }}, ...</div>
<button [disabled]="!canRoll()">Lançar dados</button>
```

---

## Glossary

- **Room**: Sala de jogo (identificada por UUID)
- **Player**: Conexão individual
- **Connection ID**: ID único da conexão WebSocket
- **Leader**: Primeiro jogador a conectar, pode iniciar jogo
- **State**: Dados completos da sala
- **Broadcast**: Enviar para todos os clientes da sala
- **Sync**: Sincronização de estado entre servidor e clientes

---

## Próximas Seções Recomendadas

- 🎲 [Game Development](./GAME_DEVELOPMENT.md) - Criar novo jogo
- 🏗️ [Architecture](./ARCHITECTURE.md) - Design detalhado
- 🤝 [Contributing](./CONTRIBUTING.md) - Code style
