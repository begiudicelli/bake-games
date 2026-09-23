export type Difficulty = 'easy' | 'medium' | 'hard';
export type GamePhase = 'waiting' | 'playing' | 'finished';

export interface PlayerState {
  name: string;
  grid: number[][];
  progress: number;
  finished: boolean;
  hasErrors: boolean;
  winner: boolean;
}

export interface RoomState {
  puzzle: number[][];
  difficulty: Difficulty;
  phase: GamePhase;
  players: Record<string, PlayerState>;
  winnerId: string | null;
}

export type ClientMessage =
  | { type: 'JOIN'; playerName: string; difficulty: Difficulty }
  | { type: 'START' }
  | { type: 'PLACE_NUMBER'; row: number; col: number; value: number }
  | { type: 'ERASE'; row: number; col: number }
  | { type: 'SUBMIT' };

export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: RoomState }
  | { type: 'ERROR'; message: string };
