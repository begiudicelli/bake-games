export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[];

export type GamePhase = 'waiting' | 'playing' | 'finished';

export interface PlayerInfo {
  symbol: Player;
  name: string;
}

export interface RoomState {
  board: Board;
  currentTurn: Player;
  phase: GamePhase;
  players: Record<string, PlayerInfo>;
  winner: Player | 'draw' | null;
}

export type ClientMessage =
  | { type: 'JOIN'; playerName: string }
  | { type: 'MOVE'; index: number }
  | { type: 'RESTART' };

export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: RoomState }
  | { type: 'ERROR'; message: string };
