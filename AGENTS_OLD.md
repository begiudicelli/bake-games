# AGENTS.md — Bake Games Repository Guide

This document serves as a permanent guide for AI agents working on the Bake Games repository. It describes the actual architecture, conventions, and patterns used in this codebase.

---

## Project Overview

**Bake Games** is a web platform for real-time multiplayer games built with Angular 19 frontend and PartyKit backend. Currently implements three games: Yahtzee, Tic Tac Toe, and Sudoku (partial).

The platform uses WebSockets (via PartySocket) for real-time communication, PartyKit for server-side room management and state synchronization, and a shared TypeScript package (`@bake/shared`) to centralize game types and contracts.

**Repository Structure:**
```
bake-games/
├── packages/shared/          # Shared types and utilities
│   └── src/
│       ├── index.ts
│       ├── yahtzee/
│       ├── tic-tac-toe/
│       └── sudoku/
├── web/                       # Angular 19 frontend
│   ├── src/app/
│   ├── package.json
│   ├── angular.json
│   ├── tsconfig.json
│   └── ...
├── server/                    # PartyKit backend
│   ├── src/
│   ├── partykit.json
│   ├── package.json
│   └── ...
├── package.json              # Workspace root (pnpm workspaces)
└── pnpm-workspace.yaml
```

---

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| Angular | 19.2.0 | Frontend framework |
| TypeScript | 5.7.2 | Language |
| Node.js | Latest | Runtime (server) |
| PartyKit | 0.0.115 | Server multiplayer infrastructure |
| PartySocket | 1.1.19 | WebSocket client library |
| RxJS | 7.8.0 | Reactive programming (not heavily used) |
| Tailwind CSS | 3.4.19 | Styling |
| Karma + Jasmine | 6.4.0, 5.6.0 | Testing framework |
| ESLint | 9.39.1 | Linting |
| Prettier | 3.8.3 | Code formatting |
| pnpm | - | Package manager with workspaces |

---

## Repository Architecture

### High-Level Data Flow

```text
Browser
  │
  ├─ Angular Components (Standalone)
  │   └─ RoomService (Signals + Computed)
  │
  ├─ PartySocket (WebSocket Client)
  │   │
  │   └─ Room ID, Party Type (yahtzee/tic-tac-toe/sudoku)
  │
  ▼
PartyKit Server
  │
  ├─ Room Manager (per roomId)
  ├─ Party Handler (yahtzee.ts / tic-tac-toe.ts / sudoku.ts)
  │
  └─ State Store (in-memory, lost on reconnect)
     └─ Players, Board State, Game Phase

Shared Contracts (@bake/shared)
  └─ Message Types (ClientMessage, ServerMessage)
  └─ State Shapes (RoomState, PlayerState, etc.)
```

### Frontend (Angular)

**Location:** `web/src/app/`

**Architecture Pattern:**
- **Standalone Components** (no NgModules)
- **Feature-based organization** within `features/` directory
- **Services** for backend communication (`core/services/`)
- **Signals + Computed** for state management (no NgRx, no Subject/Observable chains)
- **Single responsibility:** Each service handles one game type

**Key Directories:**
```
web/src/app/
├── core/
│   ├── services/
│   │   ├── yahtzee-room.service.ts
│   │   ├── tic-tac-toe-room.service.ts
│   │   └── sudoku-room.service.ts
│   ├── models/
│   │   └── game-card.ts
│   └── (guards, interceptors if added)
├── features/
│   ├── home/
│   │   ├── home-page/
│   │   └── game-entry/
│   ├── yahtzee/
│   │   ├── yahtzee-page/
│   │   ├── lobby/
│   │   ├── dice/
│   │   ├── scoreboard/
│   │   └── game-status/
│   ├── tic-tac-toe/
│   │   ├── tic-tac-toe-page/
│   │   ├── board/
│   │   ├── game-status/
│   │   └── (no lobby)
│   └── sudoku/
│       ├── sudoku-page/
│       ├── sudoku-board/
│       └── game-status/
├── shared/
│   └── components/
│       ├── room-info/
│       └── join-room-page/
├── environments/
│   ├── environment.ts (dev)
│   └── environment.prod.ts
├── app.routes.ts
├── app.config.ts
└── app.component.ts
```

**Routing:** Lazy-loaded routes in `app.routes.ts`:
- `/` → Home
- `/join/:game/:roomId` → Join Room Page
- `/:game/:roomId` → Game Page (game-specific)

**Styling:**
- Tailwind CSS for utilities
- SCSS files per component (empty or minimal)
- Global styles in `src/styles.scss`

**Components Pattern:**
```typescript
@Component({
  selector: 'app-yahtzee-page',
  standalone: true,  // Always standalone
  imports: [CommonModule, ...],
  templateUrl: './yahtzee-page.component.html',
  styleUrl: './yahtzee-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,  // Always OnPush
})
export class YahtzeePageComponent implements OnInit {
  protected readonly roomService = inject(YahtzeeRoomService);
  // Use signals, computed, inject, input, output
}
```

### Backend (PartyKit)

**Location:** `server/src/party/`

**Files:**
- `yahtzee-.ts` — Yahtzee room handler
- `tic-tac-toe.ts` — Tic Tac Toe room handler
- `sudoku.ts` — Sudoku room handler

**Configuration:** `server/partykit.json`
```json
{
  "name": "bake-server",
  "main": "src/server.ts",
  "compatibilityDate": "2026-05-20",
  "parties": {
    "tictactoe": "src/party/tic-tac-toe.ts",
    "sudoku": "src/party/sudoku.ts",
    "yahtzee": "src/party/yahtzee-.ts"
  }
}
```

**Room Lifecycle:**
1. User connects via PartySocket → `onConnect(conn)` fires
2. Client sends JOIN message → Server updates `state.players`
3. Server broadcasts STATE_UPDATE to all clients
4. Game proceeds with game-specific messages (ROLL_DICE, MOVE, etc.)
5. User disconnects → `onClose(conn)` fires → Player removed, state reset if room empty

**State Management Pattern:**
- State is **in-memory only** (not persisted to storage)
- State is recreated on reconnect if all players leave
- Single source of truth is the PartyKit room server
- Clients derive UI from received state (read-only)

**Example Room Handler Structure:**
```typescript
export default class GameServer implements Party.Server {
  private state: Game.RoomState;
  
  constructor(readonly room: Party.Room) {
    this.state = createInitialState();
  }

  private broadcast(message: Game.ServerMessage): void {
    this.room.broadcast(JSON.stringify(message));
  }

  onConnect(conn: Party.Connection): void {
    // Validate, assign player slot, send initial state
    this.sendTo(conn, { type: 'STATE_UPDATE', state: this.state });
  }

  onMessage(message: string, sender: Party.Connection): void {
    const parsed = JSON.parse(message) as Game.ClientMessage;
    // Validate player authorization (turn, permissions, etc.)
    // Update state
    // Broadcast STATE_UPDATE
  }

  onClose(conn: Party.Connection): void {
    // Remove player, reset state if needed
  }
}
```

### Shared Package (@bake/shared)

**Location:** `packages/shared/src/`

**Exports:**
```typescript
export * as Yahtzee from './yahtzee/yahtzee-types';
export * as TicTacToe from './tic-tac-toe/tic-tac-toe-types';
export * as Sudoku from './sudoku/sudoku-types';
```

**Contracts:**
Each game defines:
- `RoomState` — Entire game state structure
- `PlayerState` (or `PlayerInfo`) — Per-player information
- `ClientMessage` — Union type of all client→server messages
- `ServerMessage` — Union type of all server→client messages (typically STATE_UPDATE or ERROR)
- Game-specific types (ScoreCategory, Board, etc.)

**Example (Yahtzee):**
```typescript
export type ClientMessage =
  | { type: 'JOIN'; playerName: string }
  | { type: 'START' }
  | { type: 'ROLL_DICE' }
  | { type: 'TOGGLE_KEEP'; index: number }
  | { type: 'SELECT_CATEGORY'; category: ScoreCategory }
  | { type: 'RESTART' };

export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: RoomState }
  | { type: 'ERROR'; message: string };
```

---

## State Management & Data Flow

### Angular State Management (Signals)

**Pattern:** Services use Angular Signals to manage local client state.

**YahtzeeRoomService Example:**
```typescript
@Injectable({ providedIn: 'root' })
export class YahtzeeRoomService implements OnDestroy {
  private socket: PartySocket | null = null;

  // Writable signals (private)
  private readonly _state = signal<Yahtzee.RoomState>(initialState);
  private readonly _connectionId = signal<string | null>(null);
  private readonly _connected = signal(false);
  private readonly _error = signal<string | null>(null);

  // Read-only signals (public)
  readonly state = this._state.asReadonly();
  readonly connected = this._connected.asReadonly();
  readonly myId = computed(() => this._connectionId());
  readonly myState = computed<Yahtzee.PlayerState | null>(() => {
    const id = this._connectionId();
    if (!id) return null;
    return this._state().players[id] ?? null;
  });

  joinRoom(roomId: string, playerName: string): void {
    this.socket = new PartySocket({
      host: environment.partyKitHost,
      room: roomId,
      party: 'yahtzee',  // Must match partykit.json party name
    });

    this.socket.addEventListener('message', (event: MessageEvent) => {
      const message = JSON.parse(event.data) as Yahtzee.ServerMessage;
      if (message.type === 'STATE_UPDATE') {
        this._state.set(message.state);  // Replace entire state
      }
    });
  }

  selectCategory(category: Yahtzee.ScoreCategory): void {
    this.socket?.send(JSON.stringify({ type: 'SELECT_CATEGORY', category }));
  }
}
```

**Key Principles:**
- Signals are writable (private) and exposed as read-only
- `computed()` derives values from signals
- State is updated via `.set()` when receiving messages
- No side effects in computeds
- Services implement `OnDestroy` to clean up sockets

### Communication Protocol

**Angular → PartyKit:**
1. Establish WebSocket connection via PartySocket
2. Send JSON-serialized message matching `ClientMessage` type
3. Message includes action type and parameters

**PartyKit → Angular:**
1. Server validates message and updates state
2. Server broadcasts or sends STATE_UPDATE: `{ type: 'STATE_UPDATE', state: RoomState }`
3. Client receives, parses, updates signal via `.set()`
4. Signals notify computeds and components
5. Components re-render (OnPush change detection)

**Example Flow (Yahtzee - Roll Dice):**
```
Component (User clicks "Roll")
  ↓
roomService.rollDice()
  ↓
socket.send('{"type":"ROLL_DICE"}')
  ↓
PartyKit Server receives message
  ↓
Validate: currentTurn === sender.id, rollsLeft > 0
  ↓
rollDice(player)  // Mutate state
  ↓
broadcast({ type: 'STATE_UPDATE', state: this.state })
  ↓
All clients receive STATE_UPDATE
  ↓
roomService._state.set(message.state)
  ↓
Signals update, computeds recalculate
  ↓
OnPush change detection triggers
  ↓
Template re-renders
```

---

## Game-Specific Implementations

### Yahtzee

**Files:**
- Frontend: `web/src/app/features/yahtzee/`
- Backend: `server/src/party/yahtzee-.ts`
- Types: `packages/shared/src/yahtzee/yahtzee-types.ts`
- Service: `web/src/app/core/services/yahtzee-room.service.ts`

**Special Features:**
- **Lobby Phase:** Players join, room leader (first player) can start the game
- **Leadership:** First connected player is `leaderId`, only they can call START
- **Turn-Based:** `advanceTurn()` cycles through players, skips finished players
- **Multi-roll:** Players have 3 rolls per turn (rollsLeft counter)
- **Scoring Logic:** Upper section (basic totals) + Lower section (combinations)
- **Bonus:** 35 points if upper section total ≥ 63
- **Auto-Skip:** Player who doesn't roll in 3 turns skips to next category automatically
- **Game Over:** When all players finish all 13 categories

**Key Components:**
- `yahtzee-page`: Container, handles route params, initializes room service
- `lobby`: Displays waiting players, room URL for sharing, START button (leader only)
- `dice`: Displays 5 dice, toggle kept/unkept, ROLL button
- `scoreboard`: Shows all score categories (upper/lower), allows category selection
- `game-status`: Shows current turn player, game phase (waiting/playing/finished)

### Tic Tac Toe

**Files:**
- Frontend: `web/src/app/features/tic-tac-toe/`
- Backend: `server/src/party/tic-tac-toe.ts`
- Types: `packages/shared/src/tic-tac-toe/tic-tac-toe-types.ts`
- Service: `web/src/app/core/services/tic-tac-toe-room.service.ts`

**Special Features:**
- **2-Player Only:** Room closes after 2 players connected
- **No Lobby:** Auto-starts when 2 players connected and both named
- **Auto-Assignment:** First player is X, second is O
- **Simple Turns:** X and O alternate
- **Win Detection:** 8 combinations (rows, columns, diagonals)
- **Draw Detection:** All 9 cells filled, no winner

**Key Components:**
- `tic-tac-toe-page`: Container
- `board`: 3x3 grid, clickable cells, shows X/O/empty
- `game-status`: Shows current turn (X or O), winner/draw message
- No lobby (auto-start)

### Sudoku

**Files:**
- Frontend: `web/src/app/features/sudoku/`
- Backend: `server/src/party/sudoku.ts`
- Types: `packages/shared/src/sudoku/sudoku-types.ts`
- Service: `web/src/app/core/services/sudoku-room.service.ts`

**Status:** Partial implementation, structure exists but game logic incomplete. Sudoku state and validation logic need completion.

---

## Communication Contracts (Message Types)

### Yahtzee

**Client → Server (ClientMessage):**
```typescript
| { type: 'JOIN'; playerName: string }
| { type: 'START' }
| { type: 'ROLL_DICE' }
| { type: 'TOGGLE_KEEP'; index: number }
| { type: 'SELECT_CATEGORY'; category: ScoreCategory }
| { type: 'RESTART' }
```

**Server → Client (ServerMessage):**
```typescript
| { type: 'STATE_UPDATE'; state: RoomState }
| { type: 'ERROR'; message: string }
```

### Tic Tac Toe

**Client → Server:**
```typescript
| { type: 'JOIN'; playerName: string }
| { type: 'MOVE'; index: number }  // 0-8 for board positions
| { type: 'RESTART' }
```

**Server → Client:**
```typescript
| { type: 'STATE_UPDATE'; state: RoomState }
| { type: 'ERROR'; message: string }
```

---

## Commands & Development Workflow

### Installation

From `bake-games/` root:
```bash
# Install all dependencies (including workspaces)
npm install
# OR
pnpm install
```

### Development

**Terminal 1: Start PartyKit server**
```bash
cd server
npx partykit dev
# Server runs on http://127.0.0.1:1999
```

**Terminal 2: Start Angular dev server**
```bash
cd web
npm start
# OR
ng serve
# App runs on http://localhost:4200
```

**Requirements:**
- PartyKit must be running before opening the browser
- Angular dev server auto-reloads on file changes
- PartyKit dev server must be running for WebSocket connections

### Build

**Production Build (Angular):**
```bash
cd web
npm run build
# Output: web/dist/bake-platform/
```

**Budgets (from angular.json):**
- Initial bundle: max 1MB (warning 500kB)
- Component styles: max 8kB (warning 4kB)

### Testing

**Run tests (Karma + Jasmine):**
```bash
cd web
npm test
# OR
ng test
```

**Test files:** `*.spec.ts` co-located with components

**Current state:** Only one test file exists (`app.component.spec.ts`). Most game logic lacks tests.

### Linting & Formatting

**Lint (ESLint + angular-eslint):**
```bash
cd web
npm run lint
```

**Format (Prettier):**
```bash
# Prettier is installed but no npm script exists
# Format manually:
npx prettier --write "src/**/*.{ts,html,scss}"
```

**Prettier Config:** `.prettierrc`
```json
{
  "singleQuote": true,
  "semi": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "all"
}
```

### Root Workspace Commands

**From `bake-games/` root:**
```bash
npm install  # Installs all workspaces
npm test     # Root test (currently just echo)
```

The root `package.json` has minimal scripts. Most work happens in `web/` and `server/`.

---

## Code Conventions

### Naming

**Components:**
- `PascalCase` for component class names
- `kebab-case` for template selectors (prefix: `app-`)
- Files: `kebab-case.component.ts`
- Example: `YahtzeePageComponent` → `<app-yahtzee-page>`

**Services:**
- `PascalCase` for service class names
- `camelCase` with `Service` suffix for filenames
- Example: `YahtzeeRoomService` → `yahtzee-room.service.ts`

**Files & Folders:**
- `kebab-case` for files and directories
- `feature/` structure mirrors URL paths: `/yahtzee/:roomId` → `features/yahtzee/`

**Game Party Names (PartyKit):**
- `yahtzee` (lowercase, no hyphen in partykit.json mapping)
- `tictactoe` (no hyphens, must match `environment.partyKitHost` party param)
- `sudoku`

### Type Imports

**Import shared types:**
```typescript
import type { Yahtzee } from '@bake/shared';
// OR
import { Yahtzee } from '@bake/shared';

// Use as namespace:
const message: Yahtzee.ServerMessage = ...
const state: Yahtzee.RoomState = ...
```

**Path alias (configured in tsconfig.json):**
```typescript
"@bake/shared": ["../packages/shared/src/index.ts"]
```

### Signals Pattern

**Always use OnPush change detection:**
```typescript
changeDetection: ChangeDetectionStrategy.OnPush
```

**Signals in services:**
```typescript
// Private writable
private readonly _state = signal(initialValue);

// Public read-only
readonly state = this._state.asReadonly();

// Computed (read-only)
readonly myData = computed(() => this._state().someProperty);
```

**In components:**
```typescript
protected readonly service = inject(MyService);

// In template:
{{ service.myData() }}  // Call computed as function
```

### Component Structure

**Always standalone:**
```typescript
@Component({
  selector: 'app-feature-name',
  standalone: true,  // Never use NgModules
  imports: [CommonModule, OtherComponent, ...],
  templateUrl: './feature-name.component.html',
  styleUrl: './feature-name.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

**Dependency injection:**
```typescript
private readonly router = inject(Router);
protected readonly roomService = inject(RoomService);
```

**Protected members for template access:**
```typescript
protected readonly service = inject(MyService);
// Accessible in template
```

### Message Handling

**JSON Serialization/Deserialization:**
```typescript
// Sending
this.socket?.send(JSON.stringify({ type: 'ROLL_DICE' }));

// Receiving
const message = JSON.parse(event.data) as Yahtzee.ServerMessage;
```

**No custom serializers/deserializers yet.** Plain JSON + type assertions.

---

## Angular-Specific Patterns

### Routing & State

**Routes are lazy-loaded:**
```typescript
// app.routes.ts
{
  path: 'yahtzee/:roomId',
  loadComponent: () =>
    import('./features/yahtzee/yahtzee-page/yahtzee-page.component')
      .then(m => m.YahtzeePageComponent)
}
```

**State passing via router navigation:**
```typescript
// From game-entry.component
this.router.navigate([this.game().route, roomId], {
  state: {
    playerName,
    roomName,
    difficulty
  }
});

// In receiving component
protected playerName = this.route.snapshot.state?.playerName || 'default';
```

**Alternative: sessionStorage**
```typescript
sessionStorage.setItem('playerName', this.playerName);
const saved = sessionStorage.getItem('playerName');
```

### Forms (Reactive)

**Form Builder usage:**
```typescript
readonly form = this.fb.group({
  playerName: ['', [Validators.required, Validators.minLength(2)]],
  roomName: ['', [Validators.required, Validators.minLength(2)]],
  difficulty: ['medium'],
});

// In template
[formGroup]="form"
formControlName="playerName"

// Submit
if (this.form.invalid) return;
const { playerName, roomName } = this.form.getRawValue();
```

### Async Operations

**Crypto for room name hashing (game-entry.component):**
```typescript
async roomNameToId(name: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(name.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 8);
}
```

---

## Authentication & Authorization

**Current Implementation:**
- No user authentication system
- Player names are self-assigned (no validation of uniqueness)
- No tokens or session management
- Leadership determined by connection order (first player is leader)
- Authorization: Only leader can START game, only current player can act on their turn

**Security Considerations:**
- **No validation of playerName on server** — Any client can claim any name
- **No player identification** — Only connection ID (`conn.id`) identifies players
- **No permission checks** — Server trusts client's action requests but validates game state
- **Turn validation:** Server checks `currentTurnId === sender.id` for action validity
- **State validation:** Server checks game phase and player state before accepting actions

**Risks & TODOs:**
- Multiple players could connect with same name
- No persistent identity across reconnects
- No rate limiting or abuse protection
- No encryption of messages (TLS/SSL should be at transport layer)

---

## Environment Configuration

**Development (web/src/app/environments/environment.ts):**
```typescript
export const environment = {
  production: false,
  partyKitHost: 'localhost:1999'
};
```

**Production (web/src/app/environments/environment.prod.ts):**
```typescript
export const environment = {
  production: true,
  partyKitHost: 'game-platform.themaninthewall.partykit.dev'
};
```

**Usage in services:**
```typescript
this.socket = new PartySocket({
  host: environment.partyKitHost,
  room: roomId,
  party: 'yahtzee'
});
```

---

## Testing

### Current Test Coverage

**Existing tests:**
- `web/src/app/app.component.spec.ts` — Basic AppComponent tests

**Missing tests:**
- Services (YahtzeeRoomService, etc.)
- Game logic (PartyKit servers)
- Components (Lobby, Scoreboard, Board, etc.)
- Message handling
- State synchronization

### Test Pattern (Karma + Jasmine)

**Example structure:**
```typescript
describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

**For services with sockets:**
- Mock PartySocket
- Test signal updates on message events
- Test socket lifecycle (connect, disconnect, cleanup)

**For components with services:**
- Inject TestBed service
- Mock signals with jasmine spies
- Test computed values
- Test event handlers

---

## Known Constraints & Risks

### Architecture

1. **In-memory state only:** State is lost if all players disconnect. No persistence layer.
2. **Single connection per player:** If player reconnects, old connection is abandoned.
3. **No room cleanup:** Empty rooms persist in PartyKit until server restarts.
4. **State mutations on server:** Server mutates state directly (not immutable).

### Game Logic

5. **Yahtzee:**
   - Leader is always first player to connect (no re-election if leader leaves)
   - If leader leaves during lobby, game cannot start
   - State reset clears all player names and progress

6. **Tic Tac Toe:**
   - No rematch without leaving and rejoining
   - Auto-start only works if both players name themselves before connecting

7. **Sudoku:**
   - Game logic incomplete (board generation exists, validation missing)

### Frontend

8. **No error recovery:** Network errors are logged but not retried
9. **No reconnection logic:** Dropped socket closes; user must manually rejoin
10. **Component cleanup:** Services cleanup sockets in `ngOnDestroy`, but rapid navigation might leak sockets

### Security

11. **No auth:** Any player can claim any name
12. **No HTTPS enforcement:** Development uses HTTP (PartyKit dev server)
13. **No input validation:** Player names and messages accepted as-is
14. **No rate limiting:** Clients can spam messages

### Performance

15. **Broadcast on every action:** Server broadcasts entire state on every change (no delta updates)
16. **No lazy loading for large games:** All players' data sent even if not displayed
17. **Signal re-computation:** All computed values recalculate on any state change

---

## Change Guidelines for Agents

### Before Modifying Code

1. **Understand the existing pattern:**
   - Is there a similar feature already implemented?
   - Does it use the same architecture?
   - Can it be reused or extended?

2. **Check dependencies:**
   - Will changes affect the shared contract (`@bake/shared`)?
   - Will they break frontend-backend communication?
   - Does the message protocol need to change?

3. **Verify the game lifecycle:**
   - When does the room get created?
   - When are players added/removed?
   - When does state reset?

4. **Review type safety:**
   - Are types in `@bake/shared` correctly shared?
   - Does frontend use the same message types as backend?
   - Are computed values properly typed?

### During Implementation

**Preserve existing architecture:**
- Keep components standalone
- Use OnPush change detection
- Use signals for state, not RxJS Subject
- Extend services, don't create new patterns

**Message Protocol:**
- Add new message types to the union type in `@bake/shared`
- Update both frontend service and backend handler
- Test: client sends → server receives → broadcast updates

**State Synchronization:**
- Server state is source of truth
- Frontend state is derived from server messages
- Avoid client-side state mutations (use readonly signals)
- Reset state only at game phase transitions

**PartyKit-Specific:**
- Room IDs are deterministic (SHA-256 hash of room name, first 8 chars)
- Party name (yahtzee/tictactoe/sudoku) must match partykit.json
- Server can only broadcast or send to specific connection
- No persistence; state is ephemeral

**Angular-Specific:**
- Use `inject()` for dependencies
- Use `input()` and `output()` for component communication
- Use `signal()` and `computed()` for reactivity
- Lazy-load routes by default

### Testing New Features

1. **Manual testing:**
   - Start PartyKit dev server
   - Start Angular dev server
   - Open two browser windows, same room
   - Verify state sync between players

2. **Unit tests:**
   - Mock PartySocket if testing services
   - Test signal updates on message events
   - Test game logic functions (calculate score, check winner, etc.)

3. **Integration:**
   - Ensure frontend message matches backend expectations
   - Verify broadcast reaches all clients
   - Check error messages are user-friendly

### Common Pitfalls to Avoid

**Do NOT:**
1. Create NgModules (always standalone)
2. Use RxJS Subject/Observable chains instead of signals
3. Mutate client state directly (use `.set()`)
4. Send partial state updates (PartyKit broadcasts entire state)
5. Add persistent storage without updating reset logic
6. Change the room ID algorithm (breaks existing room links)
7. Add authentication without a backend user system
8. Use `any` type (use explicit types from @bake/shared)
9. Forget `OnDestroy` cleanup (sockets especially)
10. Assume player names are unique (they're not)

---

## Verification Checklist

After making changes, verify:

- [ ] TypeScript compiles without errors (`ng build`)
- [ ] ESLint passes (`ng lint`)
- [ ] Prettier formatting applied (`npx prettier --check`)
- [ ] Tests pass or new tests added (`ng test`)
- [ ] Message types in `@bake/shared` match frontend and backend usage
- [ ] PartyKit server compiles (no syntax errors in `*.ts`)
- [ ] Manual testing: two clients in same room, state syncs
- [ ] Manual testing: clients disconnect/reconnect, state preserved
- [ ] Error scenarios tested (room full, invalid move, wrong turn)
- [ ] No console errors in browser devtools
- [ ] No memory leaks (sockets cleaned up on ngOnDestroy)

---

## Useful Commands Summary

```bash
# Development
cd server && npx partykit dev         # Terminal 1: Start PartyKit
cd web && npm start                   # Terminal 2: Start Angular

# Build
cd web && npm run build               # Production build

# Lint & Format
cd web && npm run lint                # Check ESLint
npx prettier --write "src/**/*"       # Format code

# Testing
cd web && npm test                    # Run Karma tests

# Workspace
npm install                           # Install all (from root)
pnpm install                          # Alternative (pnpm)
```

---

## Summary

**Bake Games** is a multiplayer game platform with:
- **Frontend:** Angular 19 standalone components using signals
- **Backend:** PartyKit room servers handling per-game logic
- **Communication:** WebSocket (PartySocket) with JSON messages
- **State:** Server is source of truth, clients are read-only
- **Shared Types:** @bake/shared/src/ centralizes game contracts
- **Games:** Yahtzee (multi-player, turn-based), Tic Tac Toe (2-player), Sudoku (incomplete)

When working on this codebase, prioritize:
1. Preserving the existing architecture
2. Using TypeScript strictly
3. Keeping frontend/backend communication contracts aligned
4. Testing state synchronization
5. Avoiding side effects and mutations
