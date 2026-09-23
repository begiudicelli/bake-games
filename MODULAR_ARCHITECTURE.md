# 🏗️ Arquitetura Modular - Bake Games

## Visão Geral

Bake Games foi projetado com uma arquitetura modular que facilita a adição de novos jogos sem modificar o código existente. Cada jogo é totalmente independente e segue um padrão consistente.

## Camadas da Arquitetura

```
┌─────────────────────────────────────────┐
│   Frontend (Angular)                     │
│  - Componentes Standalone                │
│  - Serviços com Signals                  │
│  - Change Detection OnPush               │
└────────────────┬────────────────────────┘
                 │
        WebSocket / JSON RPC
                 │
┌────────────────▼────────────────────────┐
│   Shared Types (@bake/shared)            │
│  - BaseRoomState                         │
│  - BasePlayerState                       │
│  - GameMetadata                          │
└────────────────┬────────────────────────┘
                 │
        State Contracts
                 │
┌────────────────▼────────────────────────┐
│   Backend (PartyKit)                     │
│  - Room Handlers                         │
│  - Game Logic                            │
│  - State Synchronization                 │
└─────────────────────────────────────────┘
```

## Padrão de Implementação de Jogo

### 1. Tipos Compartilhados (Shared Package)

**Localização:** `packages/shared/src/[game-name]/[game-name]-types.ts`

Cada jogo define seus tipos extendendo as interfaces base:

```typescript
// Estende BasePlayerState
export interface PlayerState extends BasePlayerState {
  customField: string;
}

// Estende BaseRoomState
export interface RoomState extends BaseRoomState {
  players: Record<string, PlayerState>;
}

// Define contrato de mensagens
export type ClientMessage = 
  | { type: 'JOIN'; playerName: string }
  | { type: 'CUSTOM_ACTION'; data: any };

export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: RoomState }
  | { type: 'ERROR'; message: string };
```

**Benefícios:**
- Source of truth para contrato cliente-servidor
- Type-safe em ambas as camadas
- Reutilizável entre frontend e backend

### 2. Backend (PartyKit)

**Localização:** `server/src/party/[game-name].ts`

Segue um padrão consistente:

```typescript
export default class GameNameServer implements Party.Server {
  private state: GameName.RoomState;

  onConnect(conn) {
    // Adiciona jogador, define líder
    // Envia STATE_UPDATE
  }

  onMessage(message, sender) {
    // Valida autorização (ex: turn-based)
    // Atualiza estado
    // Broadcast STATE_UPDATE
  }

  onClose(conn) {
    // Remove jogador
    // Reset se sala vazia
  }
}
```

**Responsabilidades:**
- Gerenciar ciclo de vida da sala
- Validar ações de jogadores
- Manter estado sincronizado
- Broadcast mudanças para clientes

### 3. Frontend - Serviço (BaseRoomService)

**Localização:** `web/src/app/core/services/[game-name]-room.service.ts`

Estende `BaseRoomService` para implementar padrão consistente:

```typescript
export class GameNameRoomService 
  extends BaseRoomService<GameName.RoomState, GameName.ClientMessage, GameName.ServerMessage> {

  protected getPartyName(): string {
    return 'game-name';  // Deve match partykit.json
  }

  protected getInitialState(): GameName.RoomState {
    // Retorna estado inicial
  }

  protected handleMessage(message: GameName.ServerMessage): void {
    // Atualiza signals
  }

  readonly playersInfo = computed(() => {
    // Retorna info formatada dos jogadores
  });
}
```

**Base Service Fornece:**
- `joinRoom(roomId, playerName)` - Conecta ao servidor
- `leaveRoom()` - Desconecta
- `send(message)` - Envia mensagem
- `state`, `connected`, `error` signals read-only
- `myId`, `playersInfo` computed values

### 4. Frontend - Componentes

**Localização:** `web/src/app/features/[game-name]/`

Estrutura recomendada:

```
features/
└── [game-name]/
    ├── [game-name]-page/          # Container principal
    ├── game-board/                # Componente de jogo
    ├── game-status/               # Status/turno
    └── [outro-componente]/        # Específico do jogo
```

**Padrão de Componente:**

```typescript
@Component({
  selector: 'app-[game-name]-page',
  standalone: true,  // Always
  imports: [CommonModule, ...],
  templateUrl: './[game-name]-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,  // Always
})
export class GameNamePageComponent implements OnInit, OnDestroy {
  protected readonly roomService = inject(GameNameRoomService);

  ngOnInit() {
    this.roomService.joinRoom(roomId, playerName);
  }

  ngOnDestroy() {
    this.roomService.leaveRoom();
  }
}
```

## Arquivos Críticos para Modularização

### `packages/shared/src/common-types.ts`
Define interfaces base que todos os jogos devem estender:
- `BasePlayerState` - campos comuns: name, finished
- `BaseRoomState` - campos comuns: phase, players, currentTurnId, winnerId, leaderId
- `GameMetadata` - info para criar novo jogo

### `web/src/app/core/services/base-room.service.ts`
Classe abstrata com lógica comum:
- Gerenciamento de conexão WebSocket
- Lifecycle (connect, message, close)
- Signals e computeds básicos
- Send/Broadcast de mensagens

### `scripts/new-game.sh`
Script para gerar estrutura de novo jogo:
- Cria arquivos de tipo
- Gera serviço backend
- Gera serviço frontend
- Cria estrutura de componentes

## Checklist para Adicionar Novo Jogo

- [ ] **Shared Types** - Criar `packages/shared/src/[game]/[game]-types.ts`
- [ ] **Shared Export** - Adicionar export em `packages/shared/src/index.ts`
- [ ] **Backend Server** - Criar `server/src/party/[game].ts`
- [ ] **Backend Config** - Adicionar party em `server/partykit.json`
- [ ] **Frontend Service** - Criar `web/src/app/core/services/[game]-room.service.ts`
- [ ] **Frontend Components** - Criar estrutura em `web/src/app/features/[game]/`
- [ ] **Frontend Route** - Adicionar rota em `web/src/app/app.routes.ts`
- [ ] **Home Integration** - Adicionar jogo em home page

## Convenções Naming

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Pasta | kebab-case | `tic-tac-toe` |
| Arquivo | kebab-case | `game-board.component.ts` |
| Classe TS | PascalCase | `TicTacToePageComponent` |
| Party Name | lowercase | `tictactoe` (sem hyphens!) |
| Service | `[Name]RoomService` | `TicTacToeRoomService` |
| Selector | `app-[kebab]` | `app-tic-tac-toe-page` |

## Exemplo: Adicionar Jogo com Script

```bash
# Gerar estrutura base
./scripts/new-game.sh --name "Meu Jogo" --slug "meu-jogo" --min-players 1 --max-players 4

# Editar arquivos gerados:
# 1. Implementar lógica em packages/shared/src/meu-jogo/
# 2. Implementar servidor em server/src/party/meu-jogo.ts
# 3. Implementar componentes em web/src/app/features/meu-jogo/

# Atualizar configurações:
# 1. Adicionar export em packages/shared/src/index.ts
# 2. Adicionar party em server/partykit.json
# 3. Adicionar rota em web/src/app/app.routes.ts
# 4. Adicionar jogo em home page
```

## Boas Práticas

### Dados e Estado

✅ **Faça:**
- Use `signal()` e `computed()` no frontend
- Servidor é fonte única de verdade
- Broadcast STATE_UPDATE em qualquer mudança
- Valide tudo no servidor, nunca confie no cliente

❌ **Evite:**
- RxJS Subject/Observable chains
- Estado local no cliente (ex: localStorage)
- Mutações diretas (use `.set()`)
- Enviar estado parcial (sempre estado completo)

### Componentes

✅ **Faça:**
- `standalone: true` sempre
- `ChangeDetectionStrategy.OnPush` sempre
- `signal.asReadonly()` para expor estado
- `OnDestroy` para cleanup

❌ **Evite:**
- NgModules
- Default change detection
- Mutação de signals sem `.set()`
- Vazamento de sockets

### Type Safety

✅ **Faça:**
- Tipos explícitos em tudo
- Estender `BaseRoomState` e `BasePlayerState`
- `type` para unions
- Importar tipos do `@bake/shared`

❌ **Evite:**
- `any` type
- Tipos inline
- Duplicar tipos entre frontend/backend
- Type assertions desnecessárias

## Performance

- **Broadcast Otimizado**: Servidor envia STATE_UPDATE completo (PartyKit otimiza)
- **Change Detection**: OnPush + Signals minimiza detecção de mudanças
- **Componentes**: Lazy-loaded por rota
- **Computed**: Sem side effects, cache automático

## Segurança

- **Validação**: Sempre no servidor
- **Autorização**: Verificar turn/role no servidor
- **Rate Limiting**: A ser implementado (future)
- **Autenticação**: Placeholder (future)

---

## Próximos Passos

1. **Consulte NEW_GAME_GUIDE.md** para guia detalhado
2. **Estude os jogos existentes**: Yahtzee, Tic Tac Toe, Sudoku
3. **Use o script**: `./scripts/new-game.sh` para gerar base
4. **Implemente**: Lógica específica do jogo
5. **Teste**: Manualmente com 2+ clientes

---

Para dúvidas sobre a arquitetura, veja AGENTS.md e os jogos como referência.
