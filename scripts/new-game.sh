#!/bin/bash
# Script para criar estrutura inicial de um novo jogo
# Uso: ./scripts/new-game.sh --name "Jogo da Velha" --slug tic-tac-toe

GAME_NAME=""
GAME_SLUG=""
MIN_PLAYERS=1
MAX_PLAYERS=8

while [[ $# -gt 0 ]]; do
  case $1 in
    --name)
      GAME_NAME="$2"
      shift 2
      ;;
    --slug)
      GAME_SLUG="$2"
      shift 2
      ;;
    --min-players)
      MIN_PLAYERS="$2"
      shift 2
      ;;
    --max-players)
      MAX_PLAYERS="$2"
      shift 2
      ;;
    *)
      echo "Opção desconhecida: $1"
      exit 1
      ;;
  esac
done

if [ -z "$GAME_NAME" ] || [ -z "$GAME_SLUG" ]; then
  echo "Uso: ./scripts/new-game.sh --name 'Nome do Jogo' --slug 'slug-do-jogo'"
  exit 1
fi

# Convert to PascalCase for class names
GAME_CLASS=$(echo "$GAME_SLUG" | sed 's/-//g' | sed 's/\b\(.\)/\U\1/g')

echo "📦 Criando novo jogo: $GAME_NAME ($GAME_SLUG)"
echo "   Classe: ${GAME_CLASS}RoomService"
echo "   Min Players: $MIN_PLAYERS | Max Players: $MAX_PLAYERS"

# Create shared types
echo "1️⃣  Criando tipos compartilhados..."
mkdir -p "packages/shared/src/$GAME_SLUG"
cat > "packages/shared/src/$GAME_SLUG/${GAME_SLUG}-types.ts" << 'EOF'
import { BasePlayerState, BaseRoomState } from '../common-types';

export interface PlayerState extends BasePlayerState {
  // Add game-specific properties
  score: number;
}

export interface RoomState extends BaseRoomState {
  players: Record<string, PlayerState>;
}

export type ClientMessage =
  | { type: 'JOIN'; playerName: string }
  | { type: 'RESTART' };

export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: RoomState }
  | { type: 'ERROR'; message: string };
EOF

# Create backend server
echo "2️⃣  Criando servidor PartyKit..."
cat > "server/src/party/${GAME_SLUG}.ts" << EOF
import { $GAME_CLASS } from '@bake/shared';
import type * as Party from 'partykit/server';

function createInitialState(): $GAME_CLASS.RoomState {
  return {
    phase: 'waiting',
    players: {},
    currentTurnId: null,
    winnerId: null,
    leaderId: null,
  };
}

function createInitialPlayerState(name: string): $GAME_CLASS.PlayerState {
  return {
    name,
    finished: false,
    score: 0,
  };
}

export default class ${GAME_CLASS}Server implements Party.Server {
  private state: $GAME_CLASS.RoomState;
  private readonly maxPlayers = 8;

  constructor(readonly room: Party.Room) {
    this.state = createInitialState();
  }

  private broadcast(message: $GAME_CLASS.ServerMessage): void {
    this.room.broadcast(JSON.stringify(message));
  }

  onConnect(conn: Party.Connection): void {
    const playerCount = Object.keys(this.state.players).length;

    if (playerCount >= this.maxPlayers) {
      conn.send(JSON.stringify({ type: 'ERROR', message: 'Sala cheia.' }));
      conn.close();
      return;
    }

    this.state.players[conn.id] = createInitialPlayerState('Jogador');
    
    if (this.state.leaderId === null) {
      this.state.leaderId = conn.id;
    }
    
    conn.send(JSON.stringify({ type: 'STATE_UPDATE', state: this.state }));
  }

  onMessage(message: string, sender: Party.Connection): void {
    const parsed = JSON.parse(message) as $GAME_CLASS.ClientMessage;
    const player = this.state.players[sender.id];

    if (!player) return;

    if (parsed.type === 'JOIN') {
      player.name = parsed.playerName;
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
EOF

# Create frontend service
echo "3️⃣  Criando serviço frontend..."
mkdir -p "web/src/app/core/services"
cat > "web/src/app/core/services/${GAME_SLUG}-room.service.ts" << EOF
import { Injectable, OnDestroy, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { $GAME_CLASS } from '@bake/shared';
import { BaseRoomService } from './base-room.service';

@Injectable({ providedIn: 'root' })
export class ${GAME_CLASS}RoomService
  extends BaseRoomService<$GAME_CLASS.RoomState, $GAME_CLASS.ClientMessage, $GAME_CLASS.ServerMessage>
  implements OnDestroy {
  
  private readonly router = inject(Router);

  protected getPartyName(): string {
    return '$GAME_SLUG';
  }

  protected getInitialState(): $GAME_CLASS.RoomState {
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

  protected handleMessage(message: $GAME_CLASS.ServerMessage): void {
    if (message.type === 'STATE_UPDATE') {
      this._state.set(message.state);
      this._error.set(null);
    }
    if (message.type === 'ERROR') {
      this._error.set(message.message);
    }
  }

  readonly playersInfo = computed(() =>
    Object.entries(this._state().players).map(([id, p]) => ({
      id,
      ...p,
      isMe: id === this._connectionId(),
    })),
  );

  ngOnDestroy(): void {
    this.leaveRoom();
  }
}
EOF

# Create frontend components structure
echo "4️⃣  Criando componentes frontend..."
mkdir -p "web/src/app/features/$GAME_SLUG/${GAME_SLUG}-page"
mkdir -p "web/src/app/features/$GAME_SLUG/game-board"
mkdir -p "web/src/app/features/$GAME_SLUG/game-status"

cat > "web/src/app/features/$GAME_SLUG/${GAME_SLUG}-page/${GAME_SLUG}-page.component.ts" << EOF
import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ${GAME_CLASS}RoomService } from '../../../core/services/${GAME_SLUG}-room.service';

@Component({
  selector: 'app-${GAME_SLUG}-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './${GAME_SLUG}-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${GAME_CLASS}PageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly roomService = inject(${GAME_CLASS}RoomService);

  roomId = '';

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') ?? '';
    const playerName = history.state?.playerName;

    if (!playerName) {
      this.router.navigate([\`/join/$GAME_SLUG\`, this.roomId]);
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
EOF

cat > "web/src/app/features/$GAME_SLUG/${GAME_SLUG}-page/${GAME_SLUG}-page.component.html" << EOF
<main class="min-h-screen bg-gray-950 text-white flex flex-col p-8">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-4xl font-bold">$GAME_NAME</h1>
    <button (click)="goHome()" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
      Voltar
    </button>
  </div>

  <div *ngIf="roomService.error()" class="mb-4 p-4 bg-red-900 border border-red-600 rounded-lg">
    {{ roomService.error() }}
  </div>

  <!-- Game content here -->
  <div class="flex-1">
    <p class="text-gray-400">Jogo em desenvolvimento...</p>
  </div>
</main>
EOF

echo "✅ Estrutura criada com sucesso!"
echo ""
echo "Próximos passos:"
echo "1. Atualize packages/shared/src/index.ts para exportar ${GAME_CLASS}"
echo "2. Atualize server/partykit.json com a nova party"
echo "3. Atualize web/src/app/app.routes.ts com a nova rota"
echo "4. Implemente a lógica do jogo nos arquivos gerados"
echo ""
echo "Referência: NEW_GAME_GUIDE.md"
