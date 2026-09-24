# 🤖 AGENTS.md — Bake Games for AI Automation

Guia permanente para agentes IA (GPT, Claude, etc.) trabalharem no repositório Bake Games. Descreve estrutura, convenções e padrões usados.

---

## Quick Summary

**Bake Games** é uma plataforma modular para jogos multiplayer em tempo real.

- **Frontend:** Angular 19 standalone components com Signals
- **Backend:** PartyKit (serverless multiplayer)
- **Shared:** TypeScript types (`@bake/shared`)
- **Games:** Yahtzee (1-8), Tic Tac Toe (2), Sudoku (1-2)

**Your task:**
1. Leia esta seção inteira
2. Modifique APENAS conforme instruções do usuário
3. Siga convenções rigidamente
4. Use `docs/` para aprender antes de editar

---

## Repository Structure

```
bake-games/
├── README.md                          # Quick start
├── AGENTS.md                          # Este arquivo
├── docs/                              # Documentação (veja GETTING_STARTED.md)
│   ├── GETTING_STARTED.md
│   ├── ARCHITECTURE.md
│   ├── GAME_DEVELOPMENT.md
│   ├── CONTRIBUTING.md
│   ├── API.md
│   └── TROUBLESHOOTING.md
├── packages/shared/src/               # Shared types
│   ├── common-types.ts
│   ├── yahtzee/
│   ├── tic-tac-toe/
│   └── sudoku/
├── web/src/app/                       # Angular frontend
│   ├── core/services/
│   ├── features/
│   ├── shared/components/
│   └── app.routes.ts
├── server/src/party/                  # PartyKit backend
│   ├── yahtzee-.ts
│   ├── tic-tac-toe.ts
│   └── sudoku.ts
└── scripts/                           # Utilities
    └── new-game.sh
```

---

## Tech Stack

| Layer | Tech | Version |
|-------|------|---------|
| Frontend | Angular | 19.2.0 |
| Backend | PartyKit | 0.0.115 |
| Language | TypeScript | 5.7.2 |
| Styling | Tailwind | 3.4.19 |
| Test | Karma+Jasmine | 6.4.0 |

---

## Naming Conventions

**MUST follow exactly:**

| Element | Pattern | Example |
|---------|---------|---------|
| Folder | kebab-case | `tic-tac-toe/` |
| File | kebab-case | `game-board.component.ts` |
| Class | PascalCase | `TicTacToePageComponent` |
| Component selector | `app-kebab` | `app-game-board` |
| Service | `[Name]RoomService` | `TicTacToeRoomService` |
| Party name | lowercase | `tictactoe` (no hyphens!) |
| Variable | camelCase | `playerName` |
| Private signal | `_name` | `_playerName` |

---

## Code Patterns

### Frontend: Signals & Components

**ALWAYS:**
```typescript
@Component({
  selector: 'app-component-name',
  standalone: true,  // REQUIRED
  imports: [CommonModule, ...],
  changeDetection: ChangeDetectionStrategy.OnPush,  // REQUIRED
})
export class ComponentNameComponent {
  protected readonly service = inject(ServiceName);
  readonly mySignal = this.service.mySignal;
}
```

**NEVER:**
- NgModules
- Default change detection
- RxJS Subject/Observable chains
- `any` type

### Services: Signals + Computed

```typescript
@Injectable({ providedIn: 'root' })
export class ServiceName implements OnDestroy {
  private readonly _state = signal(initialState);
  readonly state = this._state.asReadonly();

  readonly computed = computed(() => this._state().something);

  joinRoom(roomId: string, playerName: string): void {
    this.socket = new PartySocket({...});
    this.socket.addEventListener('message', () => {
      this._state.set(newState);  // Use .set(), not mutation
    });
  }

  ngOnDestroy(): void {
    this.leaveRoom();  // Always cleanup
  }
}
```

### Backend: Room Handler

```typescript
export default class GameServer implements Party.Server {
  private state: Game.RoomState = createInitialState();

  onConnect(conn: Party.Connection): void {
    this.state.players[conn.id] = createInitialPlayerState('Jogador');
    if (this.state.leaderId === null) this.state.leaderId = conn.id;
    this.broadcast({ type: 'STATE_UPDATE', state: this.state });
  }

  onMessage(message: string, sender: Party.Connection): void {
    const parsed = JSON.parse(message) as Game.ClientMessage;
    const player = this.state.players[sender.id];
    if (!player) return;

    // Validate first
    if (state.phase !== 'playing') return;
    if (state.currentTurnId !== sender.id) return;

    // Then execute
    // Update state
    // Broadcast
    this.broadcast({ type: 'STATE_UPDATE', state: this.state });
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

---

## Data Flow

### Message Flow

```
Client App
  ↓ (socket.send)
PartySocket
  ↓ (WebSocket)
PartyKit Server
  ↓ (onMessage)
Game.onMessage(message, sender)
  ↓ (validate + execute)
Update state
  ↓ (broadcast)
All Clients receive STATE_UPDATE
  ↓ (parse + set)
roomService._state.set(newState)
  ↓ (signal update)
Computed + Templates re-render
```

### State Update Pattern

```typescript
// Frontend
this._state.set(newState);  // ALWAYS use .set() (not mutation)

// Backend
this.state.players[id].score++;  // Mutate in place
this.broadcast({ type: 'STATE_UPDATE', state: this.state });
```

---

## Game Structure

**Every game needs 3 parts:**

### 1. Types (`@bake/shared`)

```typescript
// packages/shared/src/[game]/[game]-types.ts

export interface PlayerState extends BasePlayerState {
  // Game-specific fields
}

export interface RoomState extends BaseRoomState {
  players: Record<string, PlayerState>;
  // Game-specific fields
}

export type ClientMessage = { type: 'JOIN'; ... } | { type: 'MOVE'; ... };
export type ServerMessage = { type: 'STATE_UPDATE'; state: RoomState } | { type: 'ERROR'; ... };
```

**Export in:** `packages/shared/src/index.ts`

### 2. Backend (`server/src/party/`)

```typescript
export default class GameServer implements Party.Server {
  private state = createInitialState();

  onConnect(conn) { /* Add player */ }
  onMessage(message, sender) { /* Validate & execute */ }
  onClose(conn) { /* Remove player */ }
}
```

**Register in:** `server/partykit.json` → `parties: { "gamename": "src/party/gamename.ts" }`

### 3. Frontend (`web/src/app/`)

```
features/[game-name]/
├── [game-name]-page/
├── game-board/
├── game-status/
└── ...

core/services/
└── [game-name]-room.service.ts
```

**Add route in:** `web/src/app/app.routes.ts`

---

## Modification Rules

### BEFORE you modify:

1. **Read the relevant doc** (GETTING_STARTED, ARCHITECTURE, API)
2. **Check if similar exists** - reuse patterns
3. **Verify dependencies** - what breaks if I change this?
4. **Ask yourself** - is this in the right place?

### DO:

- ✅ Use `signal()` for state
- ✅ Use `computed()` for derived values
- ✅ Validate on backend
- ✅ Broadcast full state
- ✅ Call `ngOnDestroy` for cleanup
- ✅ Use type-safe types (no `any`)
- ✅ Make small, focused commits

### DON'T:

- ❌ Mutate signals without `.set()`
- ❌ Trust client data (validate server-side)
- ❌ Send partial state updates
- ❌ Use `Subject` or `Observable`
- ❌ Skip `OnPush` change detection
- ❌ Use `any` type
- ❌ Make mega-commits

---

## Verification Checklist

After making changes:

```
TypeScript
  ☐ Compiles without errors (ng build)
  ☐ No `any` types
  ☐ Types imported from @bake/shared

Frontend
  ☐ Components are standalone
  ☐ Components use OnPush
  ☐ Signals used for state (not RxJS)
  ☐ ngOnDestroy implemented (if services)

Backend
  ☐ onConnect, onMessage, onClose implemented
  ☐ Validates all inputs
  ☐ Broadcasts STATE_UPDATE on changes
  ☐ Handles player disconnect

Communication
  ☐ Message types match ClientMessage/ServerMessage
  ☐ Frontend sends valid message
  ☐ Backend handles and broadcasts
  ☐ Frontend receives and updates state

Testing
  ☐ Single player works
  ☐ Multiplayer works (2 browser windows)
  ☐ Disconnect/reconnect handled
  ☐ No console errors

Code Quality
  ☐ ESLint passes (ng lint)
  ☐ Prettier formatted
  ☐ Follows naming conventions
  ☐ Comments on complex logic
```

---

## Common Tasks

### Add new game

```bash
./scripts/new-game.sh --name "Game Name" --slug game-slug
# Then customize the generated files
```

### Add feature to existing game

1. Extend types in `@bake/shared`
2. Implement backend logic in `server/src/party/game.ts`
3. Add service methods in `web/src/app/core/services/`
4. Update components to use new feature
5. Test multiplayer

### Fix a bug

1. Reproduce the bug
2. Identify if frontend or backend
3. Add minimal fix
4. Verify it doesn't break other things
5. Commit with `fix:` prefix

### Refactor code

1. Keep behavior identical
2. Use `refactor:` commit prefix
3. Run tests after
4. Commit separately from feature work

---

## Useful Commands

```bash
# Development
cd server && npm run dev           # PartyKit server
cd web && npm start                # Angular dev server

# Build
cd web && npm run build            # Production build

# Quality
cd web && npm run lint             # ESLint
cd web && npm run format           # Prettier
cd web && npm test                 # Karma tests

# Git
git log --oneline                  # Recent commits
git status                         # Current changes
git diff                          # See changes
```

---

## Emergency Debugging

### Browser Console

```javascript
// State inspection
JSON.stringify(roomService.state(), null, 2)

// Connection check
roomService.connected()

// Players list
roomService.playersInfo()

// Manual state update (last resort)
roomService._state.set(roomService.state())
```

### Server Logs

```bash
# Add to server code
console.log('Debug:', message);

# View in PartyKit terminal
npm run dev
# Look for output
```

### Network Inspector

F12 → Network → Filter "WS" → Click connection → Frames tab

View all WebSocket messages sent/received.

---

## Git Workflow for Agents

**Commits must be:**
- Atomic (1 change per commit)
- Semantic (`feat:`, `fix:`, `docs:`, etc)
- Under 70 chars title
- Descriptive body

**Example:**

```bash
git commit -m "feat: add dice validation in yahtzee

- Validate rolled values are 1-6
- Prevent invalid kept indices
- Add error message for clarity"
```

---

## File Location Reference

| Purpose | Location |
|---------|----------|
| Shared types | `packages/shared/src/[game]/` |
| Backend server | `server/src/party/[game].ts` |
| Frontend service | `web/src/app/core/services/[game]-room.service.ts` |
| Components | `web/src/app/features/[game]/` |
| Reusable components | `web/src/app/shared/components/` |
| Routes | `web/src/app/app.routes.ts` |
| Home integration | `web/src/app/features/home/` |

---

## When in Doubt

1. Check `docs/ARCHITECTURE.md` - padrões
2. Check `docs/API.md` - tipos e contratos
3. Study existing code - Yahtzee é exemplo completo
4. Check `docs/CONTRIBUTING.md` - estilo de código
5. Run tests - `npm test`
6. Ask user for clarification

---

## Success Criteria

Your changes are successful when:

1. TypeScript compiles
2. ESLint passes
3. Tests pass
4. Code follows conventions
5. Commit message is clear
6. Feature works as intended
7. No regressions in other games

---

**Last Updated:** Sept 2024
**Version:** 1.0
